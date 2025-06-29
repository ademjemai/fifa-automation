# Guide de Déploiement FIFA Automation

## 🚀 Déploiement sur Railway (Recommandé)

### Étape 1 : Préparer le repository GitHub

1. **Crée un repository GitHub** :
   - Va sur https://github.com/
   - Clique sur "New repository"
   - Nomme-le `fifa-automation`
   - Choisis "Public" ou "Private"

2. **Uploade tes fichiers** :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TON_USERNAME/fifa-automation.git
   git push -u origin main
   ```

### Étape 2 : Déployer sur Railway

1. **Va sur Railway** : https://railway.app/
2. **Connecte ton compte GitHub**
3. **Clique sur "New Project"**
4. **Choisis "Deploy from GitHub repo"**
5. **Sélectionne ton repository `fifa-automation`**
6. **Railway va automatiquement détecter que c'est une app Node.js**

### Étape 3 : Configuration

1. **Variables d'environnement** (optionnel) :
   - `NODE_ENV=production`
   - `PORT=3000`

2. **Railway va automatiquement** :
   - Installer les dépendances (`npm install`)
   - Démarrer l'application (`node server.js`)
   - Exposer l'URL publique

### Étape 4 : Accès

- **URL publique** : `https://ton-app.railway.app`
- **Logs** : Disponibles dans l'interface Railway
- **Base de données** : SQLite persistante dans le conteneur

## 🔧 Alternatives de déploiement

### Render.com
1. Va sur https://render.com/
2. Connecte ton GitHub
3. Crée un "Web Service"
4. Sélectionne ton repository
5. Build Command : `npm install`
6. Start Command : `node server.js`

### Heroku
1. Va sur https://heroku.com/
2. Crée une nouvelle app
3. Connecte ton GitHub
4. Active le déploiement automatique

### DigitalOcean App Platform
1. Va sur https://cloud.digitalocean.com/apps
2. Crée une nouvelle app
3. Connecte ton GitHub
4. Configure comme app Node.js

## 📋 Fichiers nécessaires

Assure-toi d'avoir ces fichiers dans ton repository :
- ✅ `package.json`
- ✅ `server.js`
- ✅ `database.js`
- ✅ `views/index.html`
- ✅ `railway.json` (pour Railway)
- ✅ `.gitignore`

## 🔍 Vérification du déploiement

Après déploiement, teste :
- **URL principale** : `https://ton-app.railway.app`
- **Health check** : `https://ton-app.railway.app/health`
- **Interface web** : `https://ton-app.railway.app`

## 🛠️ Maintenance

### Logs
- **Railway** : Interface web → Logs
- **Render** : Interface web → Logs
- **Heroku** : `heroku logs --tail`

### Redéploiement
- **Automatique** : À chaque push sur GitHub
- **Manuel** : Via l'interface web

### Variables d'environnement
- Configure dans l'interface de la plateforme
- Redémarre l'app après modification

## 💰 Coûts

### Railway
- **Gratuit** : 500 heures/mois
- **Payant** : À partir de $5/mois

### Render
- **Gratuit** : 750 heures/mois
- **Payant** : À partir de $7/mois

### Heroku
- **Gratuit** : Plus disponible
- **Payant** : À partir de $7/mois

## 🚨 Dépannage

### Problème : App ne démarre pas
- Vérifie les logs dans l'interface
- Assure-toi que `package.json` est correct
- Vérifie que `server.js` est le point d'entrée

### Problème : Base de données
- SQLite fonctionne dans les conteneurs
- Les données sont persistantes dans le conteneur
- Pour plus de robustesse, utilise PostgreSQL

### Problème : Port
- Les plateformes définissent automatiquement le port
- Utilise `process.env.PORT` dans ton code (déjà fait) 