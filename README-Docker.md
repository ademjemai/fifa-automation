# FIFA.com - Docker Deployment

Ce guide explique comment déployer l'application FIFA avec Docker.

## 🐳 Prérequis

- Docker Desktop installé
- Docker Compose installé
- Au moins 4GB de RAM disponible

## 🚀 Démarrage rapide

### 1. Construction des images
```bash
# Windows
.\docker-build.bat

# Linux/Mac
docker build -t fifa-app:latest .
docker build -f Dockerfile.playwright -t fifa-playwright:latest .
```

### 2. Lancement de l'application
```bash
# Windows
.\docker-run.bat

# Linux/Mac
docker-compose up -d
```

### 3. Accès à l'application
Ouvre ton navigateur et va sur : **http://localhost:3000**

## 📋 Commandes Docker utiles

### Voir les logs
```bash
# Logs de tous les services
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f fifa-app
```

### Arrêter l'application
```bash
docker-compose down
```

### Redémarrer l'application
```bash
docker-compose restart
```

### Voir les conteneurs en cours
```bash
docker-compose ps
```

## 🔧 Services disponibles

### Service principal (fifa-app)
- **Port** : 3000
- **Fonction** : Serveur web + base de données
- **URL** : http://localhost:3000

### Service Playwright (fifa-playwright)
- **Profil** : automation
- **Fonction** : Automatisation des tests
- **Lancement** : `docker-compose --profile automation up -d`

### Service de gestion DB (fifa-db-manager)
- **Profil** : management
- **Fonction** : Gestion de la base de données
- **Lancement** : `docker-compose --profile management run --rm fifa-db-manager`

## 🗄️ Volumes et données

### Volume fifa_data
- **Contenu** : Base de données SQLite
- **Persistance** : Les données sont conservées entre les redémarrages
- **Localisation** : Volume Docker local

### Volume logs
- **Contenu** : Fichiers de logs
- **Localisation** : `./logs/` (dossier local)

### Volume screenshots
- **Contenu** : Captures d'écran Playwright
- **Localisation** : `./screenshots/` (dossier local)

## 🔍 Monitoring et debug

### Endpoint de santé
```bash
curl http://localhost:3000/health
```

### Endpoints de debug
- `GET /debug/credentials` - Liste des identifiants
- `GET /debug/codes` - Liste des codes de sécurité
- `GET /debug/sessions` - Liste des sessions
- `POST /debug/cleanup` - Nettoyage des données

### Logs en temps réel
```bash
docker-compose logs -f fifa-app
```

## 🛠️ Configuration avancée

### Variables d'environnement
```yaml
# docker-compose.yml
environment:
  - NODE_ENV=production
  - PORT=3000
  - DOCKER_ENV=true
```

### Ports personnalisés
```yaml
# docker-compose.yml
ports:
  - "8080:3000"  # Port externe:interne
```

### Volumes personnalisés
```yaml
# docker-compose.yml
volumes:
  - ./custom-data:/app/data
```

## 🔒 Sécurité

### Utilisateur non-root
- Les conteneurs s'exécutent avec un utilisateur non-privilégié
- Permissions minimales requises

### Isolation réseau
- Chaque service est isolé dans son propre réseau
- Communication inter-services via Docker network

### Volumes sécurisés
- Les données sensibles sont stockées dans des volumes Docker
- Pas d'exposition directe des fichiers de base de données

## 🚨 Dépannage

### Problème : Port déjà utilisé
```bash
# Vérifier les ports utilisés
netstat -an | findstr :3000

# Changer le port dans docker-compose.yml
ports:
  - "3001:3000"
```

### Problème : Conteneur ne démarre pas
```bash
# Voir les logs d'erreur
docker-compose logs fifa-app

# Redémarrer proprement
docker-compose down
docker-compose up -d
```

### Problème : Base de données corrompue
```bash
# Supprimer le volume et redémarrer
docker-compose down -v
docker-compose up -d
```

### Problème : Playwright ne fonctionne pas
```bash
# Vérifier que l'image Playwright est construite
docker images | grep fifa-playwright

# Reconstruire l'image
docker build -f Dockerfile.playwright -t fifa-playwright:latest .
```

## 📊 Performance

### Ressources recommandées
- **CPU** : 2 cœurs minimum
- **RAM** : 4GB minimum
- **Stockage** : 10GB d'espace libre

### Optimisations
- Images basées sur Alpine Linux (plus légères)
- Multi-stage builds pour réduire la taille
- Cache des dépendances npm

## 🔄 Mise à jour

### Mettre à jour l'application
```bash
# Arrêter les conteneurs
docker-compose down

# Reconstruire les images
.\docker-build.bat

# Redémarrer
docker-compose up -d
```

### Sauvegarder les données
```bash
# Créer une sauvegarde
docker run --rm -v fifa_com_fifa_data:/data -v $(pwd):/backup alpine tar czf /backup/fifa-backup-$(date +%Y%m%d).tar.gz -C /data .
```

## 📝 Notes importantes

- Les données sont persistantes grâce aux volumes Docker
- L'application redémarre automatiquement en cas de crash
- Les logs sont disponibles via `docker-compose logs`
- L'endpoint `/health` permet de vérifier l'état de l'application 