# FIFA.com - Système d'Authentification avec Base de Données

Ce projet inclut maintenant une base de données SQLite pour stocker de manière sécurisée les paramètres d'authentification et les codes de sécurité.

## 🗄️ Structure de la Base de Données

### Tables créées :

1. **`auth_credentials`** - Stockage des identifiants
   - `id` : Identifiant unique
   - `email` : Adresse email (unique)
   - `password_hash` : Mot de passe haché avec bcrypt
   - `created_at` : Date de création
   - `updated_at` : Date de dernière modification

2. **`security_codes`** - Stockage des codes de sécurité
   - `id` : Identifiant unique
   - `code` : Code de sécurité
   - `email` : Email associé
   - `is_used` : Si le code a été utilisé
   - `created_at` : Date de création
   - `used_at` : Date d'utilisation

3. **`auth_sessions`** - Gestion des sessions
   - `id` : Identifiant unique
   - `email` : Email de l'utilisateur
   - `session_token` : Token de session unique
   - `is_active` : Si la session est active
   - `created_at` : Date de création
   - `expires_at` : Date d'expiration

## 🚀 Installation et Démarrage

### 🐳 Démarrage avec Docker (Recommandé)

#### Démarrage rapide
```bash
# Construction des images
.\docker-build.bat

# Lancement de l'application
.\docker-run.bat
```

#### Commandes Docker manuelles
```bash
# Construire les images
docker build -t fifa-app:latest .
docker build -f Dockerfile.playwright -t fifa-playwright:latest .

# Lancer l'application
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter l'application
docker-compose down
```

**Accès** : http://localhost:3000

### 💻 Démarrage local

#### Démarrage rapide (Windows)
```bash
# Double-cliquez sur start.bat ou exécutez :
start.bat
```

#### Démarrage manuel
```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur
node server.js
```

Le serveur sera accessible sur `http://localhost:3000`

## 🛠️ Gestion de la Base de Données

### Démarrage rapide (Windows)
```bash
# Double-cliquez sur db-manager.bat ou exécutez :
db-manager.bat
```

### Démarrage manuel
```bash
node db-manager.js
```

Ce script permet de :
- Afficher tous les identifiants stockés
- Afficher tous les codes de sécurité
- Afficher toutes les sessions actives
- Nettoyer les sessions expirées
- Nettoyer les codes anciens (plus de 24h)
- Voir les statistiques de la base de données

### Test de la base de données
```bash
node test-database.js
```

## 🔐 Sécurité

- **Mots de passe hachés** : Utilisation de bcrypt avec un facteur de coût de 10
- **Codes de sécurité temporaires** : Suppression automatique après 24h
- **Sessions avec expiration** : Sessions automatiquement désactivées
- **Nettoyage automatique** : Toutes les heures

## 📊 Fonctionnalités

### Stockage sécurisé des identifiants
- Les mots de passe sont hachés avant stockage
- Chaque email peut avoir un seul ensemble d'identifiants (mise à jour automatique)

### Gestion des codes de sécurité
- Stockage de tous les codes reçus
- Suivi de leur utilisation
- Nettoyage automatique des codes anciens

### Système de sessions
- Génération de tokens de session uniques
- Expiration automatique des sessions
- Validation des sessions actives

### Nettoyage automatique
- Sessions expirées désactivées automatiquement
- Codes de sécurité supprimés après 24h
- Nettoyage toutes les heures

## 🔧 Configuration

La base de données SQLite est créée automatiquement dans le fichier `fifa_auth.db` à la racine du projet.

### Variables d'environnement (optionnel)
- `PORT` : Port du serveur (défaut: 3000)
- `DB_PATH` : Chemin vers la base de données (défaut: `./fifa_auth.db`)
- `NODE_ENV` : Environnement (development/production)

## 📝 Utilisation

### Démarrage rapide
1. **Serveur** : Double-cliquez sur `start.bat`
2. **Gestionnaire DB** : Double-cliquez sur `db-manager.bat`
3. **Accès web** : `http://localhost:3000`

### Démarrage manuel
1. **Démarrage normal** : `node server.js`
2. **Gestion de la DB** : `node db-manager.js`
3. **Test de la DB** : `node test-database.js`
4. **Accès web** : `http://localhost:3000`

### Démarrage Docker
1. **Construction** : `.\docker-build.bat`
2. **Lancement** : `.\docker-run.bat`
3. **Accès web** : `http://localhost:3000`

## 🧹 Maintenance

Le système inclut un nettoyage automatique, mais vous pouvez aussi :

```bash
# Nettoyage manuel via l'API
curl -X POST http://localhost:3000/debug/cleanup

# Ou utiliser le gestionnaire interactif
node db-manager.js
# Puis choisir l'option 6 "Nettoyer tout"

# Ou avec Docker
docker-compose --profile management run --rm fifa-db-manager
```

## 🔍 Debug et Monitoring

- **Logs en temps réel** : Toutes les opérations sont loggées
- **Endpoints de debug** : Accès aux données via API
- **Gestionnaire interactif** : Interface en ligne de commande
- **Statistiques** : Vue d'ensemble des données stockées

### Endpoints API pour le debug

- `GET /health` - État de santé de l'application
- `GET /debug/credentials` - Lister tous les identifiants
- `GET /debug/codes` - Lister tous les codes de sécurité
- `GET /debug/sessions` - Lister toutes les sessions
- `POST /debug/cleanup` - Nettoyer les données anciennes

## 🐳 Docker

### Services disponibles
- **fifa-app** : Application principale (port 3000)
- **fifa-playwright** : Automatisation (profil automation)
- **fifa-db-manager** : Gestion DB (profil management)

### Volumes
- **fifa_data** : Base de données persistante
- **logs** : Fichiers de logs
- **screenshots** : Captures d'écran Playwright

### Commandes utiles
```bash
# Voir les logs
docker-compose logs -f

# Redémarrer
docker-compose restart

# Nettoyer
.\docker-cleanup.bat
```

**Documentation Docker complète** : [README-Docker.md](README-Docker.md)

## ⚠️ Notes importantes

- La base de données est créée automatiquement au premier démarrage
- Les mots de passe sont irrécupérables (seuls les hashs sont stockés)
- Les sessions expirent automatiquement après 24h
- Les codes de sécurité sont supprimés après 24h
- Le fichier `security_code.txt` est conservé pour compatibilité
- Les fichiers sensibles sont exclus du contrôle de version (voir `.gitignore`)
- Avec Docker, les données sont persistantes grâce aux volumes

## 📁 Structure des fichiers

```
fifa .com/
├── server.js              # Serveur principal
├── database.js            # Module de base de données
├── db-manager.js          # Gestionnaire interactif
├── test-database.js       # Script de test
├── start.bat              # Script de démarrage (Windows)
├── db-manager.bat         # Script gestionnaire (Windows)
├── package.json           # Dépendances
├── README.md              # Documentation
├── README-Docker.md       # Documentation Docker
├── .gitignore             # Fichiers exclus
├── fifa_auth.db           # Base de données SQLite (créée automatiquement)
├── security_code.txt      # Fichier de compatibilité
├── # Docker files
├── Dockerfile             # Image principale
├── Dockerfile.playwright  # Image Playwright
├── docker-compose.yml     # Orchestration
├── .dockerignore          # Fichiers exclus Docker
├── docker-build.bat       # Construction Docker
├── docker-run.bat         # Lancement Docker
├── docker-cleanup.bat     # Nettoyage Docker
└── views/
    └── index.html         # Interface web
``` 