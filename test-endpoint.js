const http = require('http');

// Test de l'endpoint /get-credentials
function testGetCredentialsEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/get-credentials',
      method: 'GET'
    };

    console.log('🧪 Test de l\'endpoint /get-credentials...');

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('📡 Statut de la réponse:', res.statusCode);
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log('✅ Endpoint fonctionne !');
            console.log('📧 Email:', response.email);
            console.log('🔑 Mot de passe:', response.password ? 'Présent' : 'Absent');
            resolve(response);
          } catch (e) {
            console.error('❌ Erreur parsing JSON:', e.message);
            reject(e);
          }
        } else {
          console.error('❌ Erreur serveur:', res.statusCode);
          console.log('📄 Réponse:', data);
          reject(new Error(`Erreur ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Erreur de connexion:', err.message);
      reject(err);
    });

    req.setTimeout(5000, () => {
      console.error('❌ Timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Test de l'endpoint /get-code
function testGetCodeEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/get-code',
      method: 'GET'
    };

    console.log('\n🧪 Test de l\'endpoint /get-code...');

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('📡 Statut de la réponse:', res.statusCode);
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log('✅ Endpoint fonctionne !');
            console.log('🔐 Code:', response.code);
            resolve(response);
          } catch (e) {
            console.error('❌ Erreur parsing JSON:', e.message);
            reject(e);
          }
        } else {
          console.error('❌ Erreur serveur:', res.statusCode);
          console.log('📄 Réponse:', data);
          reject(new Error(`Erreur ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Erreur de connexion:', err.message);
      reject(err);
    });

    req.setTimeout(5000, () => {
      console.error('❌ Timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Lancer les tests
async function runTests() {
  try {
    await testGetCredentialsEndpoint();
    await testGetCodeEndpoint();
    console.log('\n🎉 Tous les tests sont passés !');
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
  }
}

runTests(); 