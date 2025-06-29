const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Chemin vers la base de données
const dbPath = path.join(__dirname, 'fifa_auth.db');

// Créer une instance de la base de données
const db = new sqlite3.Database(dbPath);

// Initialiser la base de données avec les tables nécessaires
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Table pour les paramètres d'authentification
      db.run(`
        CREATE TABLE IF NOT EXISTS auth_credentials (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Erreur lors de la création de la table auth_credentials:', err);
          reject(err);
        } else {
          console.log('✅ Table auth_credentials créée ou déjà existante');
        }
      });

      // Table pour les codes de sécurité
      db.run(`
        CREATE TABLE IF NOT EXISTS security_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT NOT NULL,
          email TEXT NOT NULL,
          is_used BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          used_at DATETIME
        )
      `, (err) => {
        if (err) {
          console.error('Erreur lors de la création de la table security_codes:', err);
          reject(err);
        } else {
          console.log('✅ Table security_codes créée ou déjà existante');
        }
      });

      // Table pour les sessions d'authentification
      db.run(`
        CREATE TABLE IF NOT EXISTS auth_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          session_token TEXT UNIQUE NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME
        )
      `, (err) => {
        if (err) {
          console.error('Erreur lors de la création de la table auth_sessions:', err);
          reject(err);
        } else {
          console.log('✅ Table auth_sessions créée ou déjà existante');
          resolve();
        }
      });
    });
  });
}

// Sauvegarder les identifiants d'authentification
async function saveCredentials(email, password) {
  return new Promise((resolve, reject) => {
    // Hacher le mot de passe
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        reject(err);
        return;
      }

      // Insérer ou mettre à jour les identifiants
      db.run(`
        INSERT OR REPLACE INTO auth_credentials (email, password_hash, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `, [email, hash], function(err) {
        if (err) {
          console.error('Erreur lors de la sauvegarde des identifiants:', err);
          reject(err);
        } else {
          console.log(`✅ Identifiants sauvegardés pour: ${email}`);
          resolve(this.lastID);
        }
      });
    });
  });
}

// Récupérer les identifiants d'authentification
function getCredentials(email) {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT email, password_hash, created_at, updated_at
      FROM auth_credentials
      WHERE email = ?
    `, [email], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Sauvegarder un code de sécurité
function saveSecurityCode(code, email) {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO security_codes (code, email, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `, [code, email], function(err) {
      if (err) {
        console.error('Erreur lors de la sauvegarde du code:', err);
        reject(err);
      } else {
        console.log(`✅ Code de sécurité sauvegardé pour: ${email}`);
        resolve(this.lastID);
      }
    });
  });
}

// Récupérer le dernier code de sécurité non utilisé
function getLatestSecurityCode(email) {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT code, created_at
      FROM security_codes
      WHERE email = ? AND is_used = 0
      ORDER BY created_at DESC
      LIMIT 1
    `, [email], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Marquer un code comme utilisé
function markSecurityCodeAsUsed(codeId) {
  return new Promise((resolve, reject) => {
    db.run(`
      UPDATE security_codes
      SET is_used = 1, used_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [codeId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

// Créer une session d'authentification
function createSession(email, sessionToken, expiresInHours = 24) {
  return new Promise((resolve, reject) => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    db.run(`
      INSERT INTO auth_sessions (email, session_token, expires_at)
      VALUES (?, ?, ?)
    `, [email, sessionToken, expiresAt.toISOString()], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// Vérifier si une session est valide
function validateSession(sessionToken) {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT id, email, is_active, expires_at
      FROM auth_sessions
      WHERE session_token = ? AND is_active = 1 AND expires_at > CURRENT_TIMESTAMP
    `, [sessionToken], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Récupérer tous les codes de sécurité (pour debug)
function getAllSecurityCodes() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT id, code, email, is_used, created_at, used_at
      FROM security_codes
      ORDER BY created_at DESC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Récupérer toutes les sessions (pour debug)
function getAllSessions() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT id, email, session_token, is_active, created_at, expires_at
      FROM auth_sessions
      ORDER BY created_at DESC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Récupérer tous les identifiants (pour debug)
function getAllCredentials() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT id, email, created_at, updated_at
      FROM auth_credentials
      ORDER BY updated_at DESC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Nettoyer les sessions expirées
function cleanupExpiredSessions() {
  return new Promise((resolve, reject) => {
    db.run(`
      UPDATE auth_sessions
      SET is_active = 0
      WHERE expires_at < CURRENT_TIMESTAMP AND is_active = 1
    `, function(err) {
      if (err) {
        reject(err);
      } else {
        console.log(`🧹 ${this.changes} sessions expirées nettoyées`);
        resolve(this.changes);
      }
    });
  });
}

// Nettoyer les codes de sécurité anciens (plus de 24h)
function cleanupOldSecurityCodes() {
  return new Promise((resolve, reject) => {
    db.run(`
      DELETE FROM security_codes
      WHERE created_at < datetime('now', '-24 hours')
    `, function(err) {
      if (err) {
        reject(err);
      } else {
        console.log(`🧹 ${this.changes} codes de sécurité anciens supprimés`);
        resolve(this.changes);
      }
    });
  });
}

// Fermer la connexion à la base de données
function closeDatabase() {
  return new Promise((resolve) => {
    db.close((err) => {
      if (err) {
        console.error('Erreur lors de la fermeture de la base de données:', err);
      } else {
        console.log('✅ Connexion à la base de données fermée');
      }
      resolve();
    });
  });
}

module.exports = {
  initializeDatabase,
  saveCredentials,
  getCredentials,
  saveSecurityCode,
  getLatestSecurityCode,
  markSecurityCodeAsUsed,
  createSession,
  validateSession,
  getAllSecurityCodes,
  getAllSessions,
  getAllCredentials,
  cleanupExpiredSessions,
  cleanupOldSecurityCodes,
  closeDatabase
}; 