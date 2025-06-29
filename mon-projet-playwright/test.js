const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Fonction pour récupérer les identifiants depuis le serveur
async function getCredentials() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/get-credentials',
      method: 'GET'
    };

    console.log('🔗 Tentative de connexion au serveur pour récupérer les identifiants...');

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('📡 Réponse du serveur reçue, statut:', res.statusCode);
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log('✅ Données reçues du serveur');
            resolve(response);
          } catch (e) {
            console.error('❌ Erreur parsing JSON:', e.message);
            reject(new Error('Réponse invalide du serveur pour les identifiants'));
          }
        } else {
          console.error('❌ Erreur serveur, statut:', res.statusCode);
          reject(new Error(`Erreur serveur: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Erreur de connexion au serveur:', err.message);
      reject(err);
    });

    req.setTimeout(5000, () => {
      console.error('❌ Timeout de la connexion au serveur');
      req.destroy();
      reject(new Error('Timeout de la requête pour les identifiants'));
    });

    req.end();
  });
}

// Fonction pour récupérer le code depuis le serveur
async function getSecurityCode() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/get-code',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.code);
        } catch (e) {
          reject(new Error('Réponse invalide du serveur'));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout de la requête'));
    });

    req.end();
  });
}

(async () => {
  console.log('🚀 Démarrage de l\'automatisation EA FC25...');
  
  // Récupération automatique des identifiants
  console.log('🔑 Récupération automatique des identifiants...');
  let credentials = null;
  let attempts = 0;
  const maxAttempts = 30; // 30 secondes max d'attente
  
  while (!credentials && attempts < maxAttempts) {
    try {
      console.log(`🔄 Tentative ${attempts + 1}/${maxAttempts}...`);
      credentials = await getCredentials();
      console.log('✅ Identifiants récupérés automatiquement');
      break;
    } catch (e) {
      console.log(`⏳ Tentative ${attempts + 1}/${maxAttempts} - Erreur: ${e.message}`);
      await new Promise(r => setTimeout(r, 1000));
      attempts++;
    }
  }

  if (!credentials) {
    console.error('❌ Impossible de récupérer les identifiants après', maxAttempts, 'tentatives');
    console.error('💡 Vérifiez que le serveur est lancé et que vous avez soumis le formulaire');
    return;
  }

  console.log('🎯 Identifiants obtenus, lancement du navigateur...');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 // Ralentir encore plus les actions
  });
  
  const page = await browser.newPage();
  
  // Configuration des timeouts globaux
  page.setDefaultTimeout(0);
  page.setDefaultNavigationTimeout(0);

  try {
    console.log('📱 Navigation vers EA FC25...');
    await page.goto('https://www.ea.com/games/ea-sports-fc/ultimate-team/web-app/', { 
      waitUntil: 'networkidle',
      timeout: 0
    });

    // Attendre que la page soit complètement chargée
    console.log('⏳ Attente du chargement complet de la page...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Attendre 5 secondes supplémentaires

    // Prendre une capture d'écran pour debug
    await page.screenshot({ path: 'debug-page.png' });
    console.log('📸 Capture d\'écran sauvegardée: debug-page.png');

    // Afficher l'URL actuelle
    console.log('🌐 URL actuelle:', page.url());

    // 0. Cliquer sur le bouton vert "Application FC Web Companion" si présent
    console.log('🟢 Recherche du bouton vert Application FC Web Companion...');
    const greenButtonSelectors = [
      'text=Application FC Web Companion',
      'button:has-text("Application FC Web Companion")',
      'a:has-text("Application FC Web Companion")',
      'text=FC Web Companion',
      'button:has-text("FC Web Companion")',
      'a:has-text("FC Web Companion")',
      'button[aria-label*="Companion"]',
      'a[aria-label*="Companion"]',
      'button[role="button"]:has-text("Companion")',
      'a[role="button"]:has-text("Companion")',
      '.btn-green',
      '.button-green',
      'button[style*="background"]',
      'a[style*="background"]'
    ];
    let greenButtonClicked = false;
    for (const selector of greenButtonSelectors) {
      try {
        console.log(`🔍 Test du sélecteur bouton vert: ${selector}`);
        await page.waitForSelector(selector, { timeout: 3000 });
        await page.click(selector);
        console.log(`✅ Bouton vert cliqué avec: ${selector}`);
        greenButtonClicked = true;
        await page.waitForTimeout(3000);
        break;
      } catch (e) {
        console.log(`❌ Sélecteur bouton vert non trouvé: ${selector}`);
        continue;
      }
    }
    if (!greenButtonClicked) {
      console.log('⚠️ Aucun bouton vert "Application FC Web Companion" trouvé avec les sélecteurs CSS, tentative JS avancée...');
      try {
        // Recherche avancée JS : trouver un bouton ou lien contenant le texte (même partiel)
        const found = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('a, button, [role="button"]'));
          for (const el of elements) {
            if (el.innerText && el.innerText.replace(/\s+/g, ' ').toLowerCase().includes('application fc web companion')) {
              el.click();
              return true;
            }
          }
          return false;
        });
        if (found) {
          console.log('✅ Bouton vert cliqué via JS avancé !');
          await page.waitForTimeout(3000);
        } else {
          console.log('❌ Aucun bouton vert trouvé même avec JS avancé.');
        }
      } catch (e) {
        console.log('❌ Erreur JS avancée pour cliquer sur le bouton vert :', e.message);
      }
    }

    // 1. Gestion du bouton de connexion initial
    console.log('🔍 Recherche du bouton de connexion...');
    let loginButtonFound = false;
    try {
      // Sélecteurs multiples pour le bouton de connexion
      const loginSelectors = [
        'text=Connexion',
        'text=Log in',
        'text=Sign in',
        'button:has-text("Connexion")',
        'button:has-text("Log in")',
        'button:has-text("Sign in")',
        '[data-testid="login-button"]',
        '.login-button',
        '#login-button',
        'a:has-text("Log in")',
        'a:has-text("Sign in")',
        'a:has-text("Connexion")',
        // Nouveaux sélecteurs plus génériques
        'button:has-text("Se connecter")',
        'button:has-text("Login")',
        'a:has-text("Se connecter")',
        'a:has-text("Login")',
        '[role="button"]:has-text("Log in")',
        '[role="button"]:has-text("Sign in")',
        '[role="button"]:has-text("Connexion")'
      ];

      for (const selector of loginSelectors) {
        try {
          console.log(`🔍 Test du sélecteur bouton: ${selector}`);
          await page.waitForSelector(selector, { timeout: 3000 });
          console.log(`✅ Bouton trouvé avec: ${selector}`);
          await page.click(selector);
          await page.waitForTimeout(2000); // Attendre après le clic
          loginButtonFound = true;
          break;
        } catch (e) {
          console.log(`❌ Sélecteur bouton non trouvé: ${selector}`);
          continue;
        }
      }
    } catch (e) {
      console.log('ℹ️ Pas de bouton de connexion trouvé avec les sélecteurs standards');
    }

    // Si aucun bouton trouvé, essayer de chercher des liens ou boutons plus génériques
    if (!loginButtonFound) {
      console.log('🔍 Recherche de liens de connexion alternatifs...');
      try {
        // Chercher tous les liens et boutons qui pourraient être de connexion
        const allButtons = await page.$$eval('button, a, [role="button"]', elements => 
          elements.map(el => ({
            tag: el.tagName,
            text: el.textContent?.trim(),
            href: el.href,
            className: el.className,
            id: el.id
          }))
        );
        
        console.log('📋 Tous les boutons/liens trouvés:', allButtons);
        
        // Chercher des éléments contenant des mots-clés de connexion
        const loginKeywords = ['log', 'sign', 'connexion', 'connect', 'se connecter', 'login'];
        for (const element of allButtons) {
          if (element.text && loginKeywords.some(keyword => 
            element.text.toLowerCase().includes(keyword.toLowerCase())
          )) {
            console.log(`🎯 Élément de connexion potentiel trouvé:`, element);
            // Essayer de cliquer dessus
            try {
              const selector = `${element.tag.toLowerCase()}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.split(' ')[0] : ''}`;
              console.log(`🖱️ Tentative de clic sur: ${selector}`);
              await page.click(selector);
              await page.waitForTimeout(3000);
              loginButtonFound = true;
              break;
            } catch (e) {
              console.log(`❌ Impossible de cliquer sur l'élément`);
            }
          }
        }
      } catch (e) {
        console.log('❌ Erreur lors de la recherche d\'éléments alternatifs');
      }
    }

    // Attendre un peu après avoir cliqué sur le bouton de connexion
    await page.waitForTimeout(3000);

    // Vérifier si on est maintenant sur une page de connexion
    console.log('🔍 Vérification de l\'état de la page après clic sur connexion...');
    const currentUrl = page.url();
    console.log('🌐 URL actuelle après clic:', currentUrl);

    // Prendre une nouvelle capture d'écran après le clic
    await page.screenshot({ path: 'after-login-click.png' });
    console.log('📸 Capture d\'écran après clic sauvegardée: after-login-click.png');

    // 2. Attendre et remplir l'email - AUTOMATIQUE avec plus de sélecteurs
    console.log('📧 Saisie automatique de l\'email...');
    const emailSelectors = [
      'input[type="email"]',
      '#email',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]',
      'input[placeholder*="Adresse e-mail" i]',
      'input[placeholder*="E-mail" i]',
      'input[autocomplete="email"]',
      'input[data-testid="email"]',
      'input[id*="email" i]',
      'input[name*="email" i]',
      // Nouveaux sélecteurs plus génériques
      'input[type="text"][placeholder*="email" i]',
      'input[type="text"][placeholder*="Email" i]',
      'input[type="text"][placeholder*="Adresse" i]',
      'input[type="text"][placeholder*="Address" i]'
    ];

    let emailField = null;
    for (const selector of emailSelectors) {
      try {
        console.log(`🔍 Test du sélecteur email: ${selector}`);
        emailField = await page.waitForSelector(selector, { timeout: 3000 });
        console.log(`✅ Champ email trouvé avec: ${selector}`);
        break;
      } catch (e) {
        console.log(`❌ Sélecteur non trouvé: ${selector}`);
        continue;
      }
    }

    if (!emailField) {
      console.error('❌ Aucun champ email trouvé');
      console.log('🔍 Affichage de tous les champs input sur la page...');
      
      // Lister tous les champs input pour debug
      const allInputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({
          type: input.type,
          id: input.id,
          name: input.name,
          placeholder: input.placeholder,
          autocomplete: input.autocomplete,
          value: input.value
        }))
      );
      
      console.log('📋 Champs input trouvés:', allInputs);
      
      // Prendre une capture d'écran après l'erreur
      await page.screenshot({ path: 'error-no-email-field.png' });
      console.log('📸 Capture d\'erreur sauvegardée: error-no-email-field.png');
      
      // Essayer de naviguer directement vers la page de connexion EA
      console.log('🔄 Tentative de navigation directe vers la page de connexion EA...');
      try {
        await page.goto('https://signin.ea.com/p/originX/login', { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'direct-login-page.png' });
        console.log('📸 Capture de la page de connexion directe: direct-login-page.png');
        
        // Réessayer de trouver le champ email
        for (const selector of emailSelectors) {
          try {
            console.log(`🔍 Test du sélecteur email (page directe): ${selector}`);
            emailField = await page.waitForSelector(selector, { timeout: 3000 });
            console.log(`✅ Champ email trouvé avec: ${selector}`);
            break;
          } catch (e) {
            console.log(`❌ Sélecteur non trouvé: ${selector}`);
            continue;
          }
        }
        
        if (!emailField) {
          throw new Error('Champ email non trouvé même sur la page de connexion directe');
        }
      } catch (e) {
        console.error('❌ Erreur lors de la navigation directe:', e.message);
        throw new Error('Champ email non trouvé - voir les captures d\'écran pour debug');
      }
    }

    await emailField.fill(credentials.email);
    console.log('✅ Email saisi automatiquement:', credentials.email);

    // Cliquer sur le bouton NEXT si présent
    console.log('➡️ Recherche et clic sur le bouton NEXT...');
    const nextButtonSelectors = [
      'button:has-text("Next")',
      'button[type="submit"]',
      'button#loginBtn',
      'button[data-testid="btnLogin"]',
      'button:has-text("Suivant")',
      'button:has-text("Continuer")',
      'button:has-text("Continue")',
      'button:has-text("Connexion")',
      'button:has-text("Log in")',
      'button:has-text("Sign in")',
      'input[type="submit"]',
      '[data-testid="submit-button"]'
    ];
    let nextButtonClicked = false;
    for (const selector of nextButtonSelectors) {
      try {
        console.log(`🔍 Test du sélecteur bouton NEXT: ${selector}`);
        const btn = await page.waitForSelector(selector, { timeout: 3000 });
        await btn.click();
        console.log(`✅ Bouton NEXT cliqué avec: ${selector}`);
        nextButtonClicked = true;
        await page.waitForTimeout(2000);
        break;
      } catch (e) {
        console.log(`❌ Sélecteur bouton NEXT non trouvé: ${selector}`);
        continue;
      }
    }
    if (!nextButtonClicked) {
      console.log('⚠️ Aucun bouton NEXT trouvé avec les sélecteurs CSS, tentative JS avancée...');
      try {
        // Recherche avancée JS : trouver un bouton contenant le texte NEXT (insensible à la casse)
        const found = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('button, input[type=submit], [role=button]'));
          for (const el of elements) {
            if (el.innerText && el.innerText.replace(/\s+/g, ' ').toLowerCase().includes('next')) {
              el.click();
              return true;
            }
            // Certains boutons peuvent être input[type=submit] sans innerText
            if (el.value && el.value.toLowerCase().includes('next')) {
              el.click();
              return true;
            }
          }
          return false;
        });
        if (found) {
          console.log('✅ Bouton NEXT cliqué via JS avancé !');
          await page.waitForTimeout(2000);
        } else {
          console.log('❌ Aucun bouton NEXT trouvé même avec JS avancé.');
        }
      } catch (e) {
        console.log('❌ Erreur JS avancée pour cliquer sur le bouton NEXT :', e.message);
      }
    }

    // 3. Remplir le mot de passe - AUTOMATIQUE
    console.log('🔐 Saisie automatique du mot de passe...');
    const passwordSelectors = [
      'input[type="password"]',
      '#password',
      'input[name="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="Mot de passe" i]',
      'input[placeholder*="Password" i]',
      'input[autocomplete="current-password"]',
      'input[data-testid="password"]',
      'input[id*="password" i]',
      'input[name*="password" i]'
    ];

    let passwordField = null;
    for (const selector of passwordSelectors) {
      try {
        console.log(`🔍 Test du sélecteur mot de passe: ${selector}`);
        passwordField = await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`✅ Champ mot de passe trouvé avec: ${selector}`);
        break;
      } catch (e) {
        console.log(`❌ Sélecteur non trouvé: ${selector}`);
        continue;
      }
    }

    if (!passwordField) {
      throw new Error('Champ mot de passe non trouvé');
    }

    await passwordField.fill(credentials.password);
    console.log('✅ Mot de passe saisi automatiquement');

    // Cliquer sur le bouton SIGN IN après avoir rempli le mot de passe
    console.log('➡️ Recherche et clic sur le bouton SIGN IN...');
    const signInButtonSelectors = [
      'button:has-text("Sign in")',
      'button:has-text("SIGN IN")',
      'button:has-text("Connexion")',
      'button:has-text("Se connecter")',
      'button:has-text("Log in")',
      'button[type="submit"]',
      'input[type="submit"]',
      '[data-testid="submit-button"]',
      'button[data-testid="btnLogin"]',
      'button#loginBtn',
      'button:has-text("Continue")',
      'button:has-text("Continuer")'
    ];
    let signInButtonClicked = false;
    for (const selector of signInButtonSelectors) {
      try {
        console.log(`🔍 Test du sélecteur bouton SIGN IN: ${selector}`);
        const btn = await page.waitForSelector(selector, { timeout: 3000 });
        await btn.click();
        console.log(`✅ Bouton SIGN IN cliqué avec: ${selector}`);
        signInButtonClicked = true;
        await page.waitForTimeout(2000);
        break;
      } catch (e) {
        console.log(`❌ Sélecteur bouton SIGN IN non trouvé: ${selector}`);
        continue;
      }
    }
    if (!signInButtonClicked) {
      // Recherche avancée JS si les sélecteurs CSS échouent
      console.log('⚠️ Aucun bouton SIGN IN trouvé avec les sélecteurs CSS, tentative JS avancée...');
      try {
        const found = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('button, input[type=submit], [role=button]'));
          for (const el of elements) {
            if (el.innerText && el.innerText.replace(/\s+/g, ' ').toLowerCase().includes('sign in')) {
              el.click();
              return true;
            }
            if (el.value && el.value.toLowerCase().includes('sign in')) {
              el.click();
              return true;
            }
          }
          return false;
        });
        if (found) {
          console.log('✅ Bouton SIGN IN cliqué via JS avancé !');
          await page.waitForTimeout(2000);
        } else {
          console.log('❌ Aucun bouton SIGN IN trouvé même avec JS avancé.');
        }
      } catch (e) {
        console.log('❌ Erreur JS avancée pour cliquer sur le bouton SIGN IN :', e.message);
      }
    }

    // 4. Gestion du code de sécurité EA (si présent)
    console.log('🔑 Vérification du code de sécurité EA...');

    // Cliquer automatiquement sur le bouton SEND CODE si présent
    console.log('➡️ Recherche et clic sur le bouton SEND CODE...');
    const sendCodeButtonSelectors = [
      'button:has-text("SEND CODE")',
      'button:has-text("Send code")',
      'button:has-text("Envoyer le code")',
      'button:has-text("Envoyer")',
      'button:has-text("Code")',
      'button[type="submit"]',
      'input[type="submit"]',
      '[data-testid="send-code-button"]',
      'button[data-testid="send-code"]',
      'button#sendCode',
      'button:has-text("Continue")',
      'button:has-text("Continuer")'
    ];
    let sendCodeButtonClicked = false;
    for (const selector of sendCodeButtonSelectors) {
      try {
        console.log(`🔍 Test du sélecteur bouton SEND CODE: ${selector}`);
        const btn = await page.waitForSelector(selector, { timeout: 3000 });
        await btn.click();
        console.log(`✅ Bouton SEND CODE cliqué avec: ${selector}`);
        sendCodeButtonClicked = true;
        await page.waitForTimeout(2000);
        break;
      } catch (e) {
        console.log(`❌ Sélecteur bouton SEND CODE non trouvé: ${selector}`);
        continue;
      }
    }
    if (!sendCodeButtonClicked) {
      // Recherche avancée JS si les sélecteurs CSS échouent
      console.log('⚠️ Aucun bouton SEND CODE trouvé avec les sélecteurs CSS, tentative JS avancée...');
      try {
        const found = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('button, input[type=submit], [role=button]'));
          for (const el of elements) {
            if (el.innerText && el.innerText.replace(/\s+/g, ' ').toLowerCase().includes('send code')) {
              el.click();
              return true;
            }
            if (el.value && el.value.toLowerCase().includes('send code')) {
              el.click();
              return true;
            }
          }
          return false;
        });
        if (found) {
          console.log('✅ Bouton SEND CODE cliqué via JS avancé !');
          await page.waitForTimeout(2000);
        } else {
          console.log('❌ Aucun bouton SEND CODE trouvé même avec JS avancé.');
        }
      } catch (e) {
        console.log('❌ Erreur JS avancée pour cliquer sur le bouton SEND CODE :', e.message);
      }
    }

    // 5. Cliquer sur le bouton de connexion
    console.log('🚀 Soumission du formulaire...');
    const submitSelectors = [
      'button[type="submit"]',
      '#btnLogin',
      'button:has-text("Connexion")',
      'button:has-text("Log in")',
      'button:has-text("Sign in")',
      'input[type="submit"]',
      '[data-testid="submit-button"]',
      'button:has-text("Continue")',
      'button:has-text("Next")'
    ];

    for (const selector of submitSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`✅ Bouton de soumission trouvé avec: ${selector}`);
        await page.click(selector);
        break;
      } catch (e) {
        continue;
      }
    }

    // 6. Attendre et gérer le code de sécurité (2FA) - AUTOMATIQUE
    console.log('⏳ Attente du code de sécurité 2FA...');
    try {
      const twoFactorSelectors = [
        'input[type="text"][name*="code" i]',
        'input[type="text"][id*="code" i]',
        'input[type="text"][placeholder*="code" i]',
        'input[type="text"][placeholder*="Code" i]',
        'input[name="securityCode"]',
        '#securityCode'
      ];

      let twoFactorField = null;
      for (const selector of twoFactorSelectors) {
        try {
          twoFactorField = await page.waitForSelector(selector, { timeout: 10000 });
          console.log(`✅ Champ 2FA trouvé avec: ${selector}`);
          break;
        } catch (e) {
          continue;
        }
      }

      if (twoFactorField) {
        console.log('📱 Récupération automatique du code depuis le serveur...');
        
        // Récupérer le code automatiquement depuis le serveur
        let code = '';
        let attempts = 0;
        const maxAttempts = 60; // 1 minute max d'attente
        
        while (!code && attempts < maxAttempts) {
          try {
            code = await getSecurityCode();
            if (code) {
              console.log(`✅ Code récupéré automatiquement: ${code}`);
              break;
            }
          } catch (e) {
            console.log(`⏳ Tentative ${attempts + 1}/${maxAttempts} - Code pas encore disponible...`);
          }
          
          if (!code) {
            await new Promise(r => setTimeout(r, 1000));
            attempts++;
          }
        }

        if (code) {
          console.log('✅ Code reçu, saisie automatique en cours...');
          await twoFactorField.fill(code);
          
          // Cliquer pour valider le code
          const validateSelectors = [
            'button:has-text("SIGN IN")',
            'button:has-text("Sign in")',
            'button:has-text("Continuer")',
            'button:has-text("Continue")',
            'button:has-text("Valider")',
            'button:has-text("Valide")',
            'button:has-text("OK")',
            'button:has-text("Confirmer")',
            'button[type="submit"]',
            'input[type="submit"]',
            '[data-testid="submit-button"]',
            'button[data-testid="btnLogin"]',
            'button#loginBtn'
          ];
          let validated = false;
          for (const selector of validateSelectors) {
            try {
              console.log(`🔍 Test du sélecteur bouton validation code 2FA: ${selector}`);
              await page.waitForSelector(selector, { timeout: 3000 });
              await page.click(selector);
              console.log(`✅ Bouton validation code 2FA cliqué avec: ${selector}`);
              validated = true;
              await page.waitForTimeout(2000);
              break;
            } catch (e) {
              console.log(`❌ Sélecteur bouton validation code 2FA non trouvé: ${selector}`);
              continue;
            }
          }
          if (!validated) {
            // Recherche avancée JS si les sélecteurs CSS échouent
            console.log('⚠️ Aucun bouton validation code 2FA trouvé avec les sélecteurs CSS, tentative JS avancée...');
            try {
              const found = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('button, input[type=submit], [role=button]'));
                for (const el of elements) {
                  if (el.innerText && el.innerText.replace(/\s+/g, ' ').toLowerCase().includes('sign in')) {
                    el.click();
                    return true;
                  }
                  if (el.value && el.value.toLowerCase().includes('sign in')) {
                    el.click();
                    return true;
                  }
                }
                return false;
              });
              if (found) {
                console.log('✅ Bouton validation code 2FA cliqué via JS avancé !');
                await page.waitForTimeout(2000);
              } else {
                console.log('❌ Aucun bouton validation code 2FA trouvé même avec JS avancé.');
              }
            } catch (e) {
              console.log('❌ Erreur JS avancée pour cliquer sur le bouton validation code 2FA :', e.message);
            }
          }
        } else {
          console.log('❌ Timeout: Code non reçu dans le délai imparti');
        }
      }
    } catch (e) {
      console.log('ℹ️ Pas de 2FA détecté ou déjà connecté');
    }

    // 7. Attendre la fin du processus
    console.log('⏳ Attente de la finalisation...');
    await page.waitForTimeout(10000);

    // 8. Vérifier si on est connecté
    try {
      // Chercher des éléments qui indiquent qu'on est connecté
      const successSelectors = [
        'text=Ultimate Team',
        'text=Transfer Market',
        'text=My Club',
        '.user-profile',
        '[data-testid="user-menu"]'
      ];

      let connected = false;
      for (const selector of successSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          console.log(`✅ Connexion réussie! Élément trouvé: ${selector}`);
          connected = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!connected) {
        console.log('⚠️ Statut de connexion incertain');
      }
    } catch (e) {
      console.log('⚠️ Impossible de vérifier le statut de connexion');
    }

    console.log('🎉 Processus terminé!');
    console.log('📧 Email utilisé:', credentials.email);
    console.log('🔐 Mot de passe utilisé: ***');

  } catch (error) {
    console.error('❌ Erreur lors de l\'automatisation:', error.message);
  } finally {
    // Garder le navigateur ouvert pour inspection
    console.log('🔍 Navigateur laissé ouvert pour inspection...');
    // await browser.close();
  }
})();


