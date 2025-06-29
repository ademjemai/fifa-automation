const db = require('./database');
const crypto = require('crypto');

async function testDatabase() {
  console.log('🧪 Test de la base de données FIFA...\n');

  try {
    // 1. Initialiser la base de données
    console.log('1. Initialisation de la base de données...');
    await db.initializeDatabase();
    console.log('✅ Base de données initialisée\n');

    // 2. Tester la sauvegarde d'identifiants
    console.log('2. Test de sauvegarde d\'identifiants...');
    const testEmail = 'test@example.com';
    const testPassword = 'motdepasse123';
    
    await db.saveCredentials(testEmail, testPassword);
    console.log('✅ Identifiants sauvegardés\n');

    // 3. Tester la récupération d'identifiants
    console.log('3. Test de récupération d\'identifiants...');
    const credentials = await db.getCredentials(testEmail);
    if (credentials) {
      console.log('✅ Identifiants récupérés pour:', credentials.email);
      console.log('   Créé le:', credentials.created_at);
      console.log('   Mis à jour le:', credentials.updated_at);
    } else {
      console.log('❌ Échec de récupération des identifiants');
    }
    console.log('');

    // 4. Tester la sauvegarde de codes de sécurité
    console.log('4. Test de sauvegarde de codes de sécurité...');
    const testCode = '123456';
    await db.saveSecurityCode(testCode, testEmail);
    console.log('✅ Code de sécurité sauvegardé\n');

    // 5. Tester la récupération de codes
    console.log('5. Test de récupération de codes...');
    const securityCode = await db.getLatestSecurityCode(testEmail);
    if (securityCode) {
      console.log('✅ Code récupéré:', securityCode.code);
      console.log('   Créé le:', securityCode.created_at);
    } else {
      console.log('❌ Échec de récupération du code');
    }
    console.log('');

    // 6. Tester la création de session
    console.log('6. Test de création de session...');
    const sessionToken = crypto.randomBytes(32).toString('hex');
    await db.createSession(testEmail, sessionToken, 1); // 1 heure
    console.log('✅ Session créée\n');

    // 7. Tester la validation de session
    console.log('7. Test de validation de session...');
    const session = await db.validateSession(sessionToken);
    if (session) {
      console.log('✅ Session validée pour:', session.email);
      console.log('   Expire le:', session.expires_at);
    } else {
      console.log('❌ Échec de validation de session');
    }
    console.log('');

    // 8. Tester les statistiques
    console.log('8. Test des statistiques...');
    const [allCredentials, allCodes, allSessions] = await Promise.all([
      db.getAllCredentials(),
      db.getAllSecurityCodes(),
      db.getAllSessions()
    ]);

    console.log('📊 Statistiques:');
    console.log(`   - Identifiants: ${allCredentials.length}`);
    console.log(`   - Codes de sécurité: ${allCodes.length}`);
    console.log(`   - Sessions: ${allSessions.length}`);
    console.log('');

    // 9. Test de nettoyage
    console.log('9. Test de nettoyage...');
    const [expiredSessions, oldCodes] = await Promise.all([
      db.cleanupExpiredSessions(),
      db.cleanupOldSecurityCodes()
    ]);
    console.log(`✅ Nettoyage terminé: ${expiredSessions} sessions, ${oldCodes} codes`);
    console.log('');

    console.log('🎉 Tous les tests sont passés avec succès !');
    console.log('✅ La base de données fonctionne correctement');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    console.error(error.stack);
  } finally {
    // Fermer la connexion
    await db.closeDatabase();
    console.log('🔒 Connexion à la base de données fermée');
  }
}

// Lancer les tests
testDatabase(); 