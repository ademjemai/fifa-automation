#!/usr/bin/env node

const db = require('./database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function showMenu() {
  console.log('\n=== Gestionnaire de Base de Données FIFA ===');
  console.log('1. Afficher tous les identifiants');
  console.log('2. Afficher tous les codes de sécurité');
  console.log('3. Afficher toutes les sessions');
  console.log('4. Nettoyer les sessions expirées');
  console.log('5. Nettoyer les codes anciens');
  console.log('6. Nettoyer tout');
  console.log('7. Statistiques de la base de données');
  console.log('8. Quitter');
  console.log('==========================================');
}

async function showCredentials() {
  try {
    const credentials = await db.getAllCredentials();
    console.log('\n📧 Identifiants stockés:');
    if (credentials.length === 0) {
      console.log('Aucun identifiant trouvé');
    } else {
      credentials.forEach((cred, index) => {
        console.log(`${index + 1}. Email: ${cred.email}`);
        console.log(`   Créé: ${cred.created_at}`);
        console.log(`   Mis à jour: ${cred.updated_at}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function showSecurityCodes() {
  try {
    const codes = await db.getAllSecurityCodes();
    console.log('\n🔐 Codes de sécurité:');
    if (codes.length === 0) {
      console.log('Aucun code trouvé');
    } else {
      codes.forEach((code, index) => {
        console.log(`${index + 1}. Code: ${code.code}`);
        console.log(`   Email: ${code.email}`);
        console.log(`   Utilisé: ${code.is_used ? 'Oui' : 'Non'}`);
        console.log(`   Créé: ${code.created_at}`);
        if (code.used_at) {
          console.log(`   Utilisé le: ${code.used_at}`);
        }
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function showSessions() {
  try {
    const sessions = await db.getAllSessions();
    console.log('\n🔑 Sessions actives:');
    if (sessions.length === 0) {
      console.log('Aucune session trouvée');
    } else {
      sessions.forEach((session, index) => {
        console.log(`${index + 1}. Email: ${session.email}`);
        console.log(`   Token: ${session.session_token.substring(0, 16)}...`);
        console.log(`   Actif: ${session.is_active ? 'Oui' : 'Non'}`);
        console.log(`   Créé: ${session.created_at}`);
        console.log(`   Expire: ${session.expires_at}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function cleanupExpiredSessions() {
  try {
    const count = await db.cleanupExpiredSessions();
    console.log(`✅ ${count} sessions expirées nettoyées`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function cleanupOldCodes() {
  try {
    const count = await db.cleanupOldSecurityCodes();
    console.log(`✅ ${count} codes anciens supprimés`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function cleanupAll() {
  try {
    const [sessions, codes] = await Promise.all([
      db.cleanupExpiredSessions(),
      db.cleanupOldSecurityCodes()
    ]);
    console.log(`✅ Nettoyage terminé: ${sessions} sessions, ${codes} codes`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function showStats() {
  try {
    const [credentials, codes, sessions] = await Promise.all([
      db.getAllCredentials(),
      db.getAllSecurityCodes(),
      db.getAllSessions()
    ]);

    const activeSessions = sessions.filter(s => s.is_active);
    const usedCodes = codes.filter(c => c.is_used);
    const unusedCodes = codes.filter(c => !c.is_used);

    console.log('\n📊 Statistiques de la base de données:');
    console.log(`📧 Identifiants: ${credentials.length}`);
    console.log(`🔐 Codes de sécurité: ${codes.length}`);
    console.log(`   - Utilisés: ${usedCodes.length}`);
    console.log(`   - Non utilisés: ${unusedCodes.length}`);
    console.log(`🔑 Sessions: ${sessions.length}`);
    console.log(`   - Actives: ${activeSessions.length}`);
    console.log(`   - Expirées: ${sessions.length - activeSessions.length}`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function main() {
  try {
    // Initialiser la base de données
    await db.initializeDatabase();
    console.log('✅ Base de données initialisée');

    while (true) {
      await showMenu();
      const choice = await question('Choisissez une option (1-8): ');

      switch (choice.trim()) {
        case '1':
          await showCredentials();
          break;
        case '2':
          await showSecurityCodes();
          break;
        case '3':
          await showSessions();
          break;
        case '4':
          await cleanupExpiredSessions();
          break;
        case '5':
          await cleanupOldCodes();
          break;
        case '6':
          await cleanupAll();
          break;
        case '7':
          await showStats();
          break;
        case '8':
          console.log('👋 Au revoir!');
          await db.closeDatabase();
          rl.close();
          process.exit(0);
          break;
        default:
          console.log('❌ Option invalide');
      }

      await question('\nAppuyez sur Entrée pour continuer...');
    }
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    await db.closeDatabase();
    rl.close();
    process.exit(1);
  }
}

// Gestion de la fermeture propre
process.on('SIGINT', async () => {
  console.log('\n🔄 Fermeture...');
  await db.closeDatabase();
  rl.close();
  process.exit(0);
});

main(); 