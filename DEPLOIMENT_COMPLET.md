# 🚀 Guide de Déploiement Complet - Voisins Connect

Guide étape par étape pour déployer l'application sur Render (backend) et Vercel (frontend).

---

## 📋 Prérequis

- ✅ Compte GitHub : https://github.com
- ✅ Compte Render : https://render.com
- ✅ Compte Vercel : https://github.com/florian-billon/voisins-connect
- ✅ Repository GitHub déjà créé : https://github.com/florian-billon/voisins-connect

---

## 🗄️ ÉTAPE 1 : Déployer le Backend sur Render

### 1.1 Se connecter à Render

1. Allez sur : https://dashboard.render.com
2. Connectez-vous avec votre compte GitHub
3. Cliquez sur "New +" → "Web Service"

### 1.2 Connecter le repository

1. **Repository** : Sélectionnez `florian-billon/voisins-connect`
2. **Branch** : Sélectionnez `main`
3. **Name** : `voisins-connect-backend`
4. **Region** : Choisissez la région la plus proche (ex: Oregon (US West))
5. **Root Directory** : Laissez vide (le backend est à la racine)

### 1.3 Configurer le Build

1. **Runtime** : Docker
2. **Dockerfile Path** : `backend/Dockerfile`
3. **Docker Context** : `backend`
4. **Docker Command** : Laissez vide

### 1.4 Configurer les Variables d'Environnement

Cliquez sur "Advanced" → "Add Environment Variable" et ajoutez :

```
DATABASE_URL = postgresql://neondb_owner:npg_osO3xDfwiIm2@ep-dry-union-aym1o38g-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

```
MONGODB_URL = mongodb+srv://helloworld:helloworld@cluster0.o2z1nqe.mongodb.net/?appName=Cluster0
```

```
JWT_SECRET = super_secret_jwt_key_change_in_production_12345
```

```
PORT = 3001
```

```
S3_BUCKET = dummy
```

```
VAPID_PUBLIC_KEY = BMdUmXuSDj6rvdghKjGUtI7DfRQ3eUGfLnVnyet4LexV2G32gcqfV8C4SqU90JpwpkDeVi2dug6zuHj8MCYRlms
```

```
VAPID_PRIVATE_KEY = kF7SMmZrQ9YfykUq5srXBGtPKqrT-3VZ16Q4hiu_cz0
```

```
VAPID_SUBJECT = mailto:contact@voisins-connect.app
```

### 1.5 Lancer le déploiement

1. Cliquez sur "Create Web Service"
2. Attendez que le build se termine (5-10 minutes)
3. Une fois terminé, vous aurez une URL comme : `https://voisins-connect.onrender.com`

### 1.6 Vérifier le déploiement

1. Cliquez sur l'URL : `https://voisins-connect.onrender.com/health`
2. Vous devriez voir : `OK`

---

## 🌐 ÉTAPE 2 : Déployer le Frontend sur Vercel

### 2.1 Se connecter à Vercel

1. Allez sur : https://vercel.com/dashboard
2. Connectez-vous avec votre compte GitHub
3. Cliquez sur "Add New..." → "Project"

### 2.2 Importer le repository

1. **Repository** : Sélectionnez `florian-billon/voisins-connect`
2. Cliquez sur "Import"

### 2.3 Configurer le projet

1. **Project Name** : `voisins-connect` (ou ce que vous voulez)
2. **Framework Preset** : Next.js
3. **Root Directory** : `frontend` ⚠️ IMPORTANT !
4. **Build Command** : `npm run build`
5. **Output Directory** : `.next`

### 2.4 Configurer les Variables d'Environnement

Cliquez sur "Environment Variables" et ajoutez :

```
NEXT_PUBLIC_API_URL = https://voisins-connect.onrender.com
```

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY = BMdUmXuSDj6rvdghKjGUtI7DfRQ3eUGfLnVnyet4LexV2G32gcqfV8C4SqU90JpwpkDeVi2dug6zuHj8MCYRlms
```

### 2.5 Lancer le déploiement

1. Cliquez sur "Deploy"
2. Attendez que le build se termine (2-5 minutes)
3. Une fois terminé, vous aurez une URL comme : `https://voisins-connect-xxxx.vercel.app`

### 2.6 Vérifier le déploiement

1. Cliquez sur l'URL : `https://votre-url.vercel.app`
2. Vous devriez voir la page de login

---

## ✅ ÉTAPE 3 : Tests Post-Déploiement

### 3.1 Tester le Backend

1. **Health Check** : `https://voisins-connect.onrender.com/health` → Devrait retourner `OK`
2. **Login** : Utilisez Postman ou curl pour tester `/auth/login`

### 3.2 Tester le Frontend

1. **Page de login** : `https://votre-url.vercel.app/login`
2. **Créer un compte** : Testez l'inscription
3. **Se connecter** : Testez le login
4. **Créer un groupe** : Testez la création de serveur
5. **Créer un salon** : Testez la création de channel

### 3.3 Tester les Notifications Push (Optionnel)

Les notifications push ne sont pas encore activées en production, mais l'infrastructure est prête.

---

## 🔧 ÉTAPE 4 : Configuration des Domaines (Optionnel)

### 4.1 Sur Vercel

1. Allez sur "Settings" → "Domains"
2. Cliquez sur "Add Domain"
3. Entrez votre domaine (ex: `voisins-connect.app`)
4. Suivez les instructions DNS

### 4.2 Sur Render

1. Allez sur "Settings" → "Domains & TLS"
2. Cliquez sur "Add Domain"
3. Entrez votre sous-domaine (ex: `api.voisins-connect.app`)
4. Suivez les instructions DNS

---

## 📊 ÉTAPE 5 : Monitoring

### 5.1 Sur Render

1. **Logs** : Cliquez sur "Logs" pour voir les logs du backend
2. **Metrics** : Cliquez sur "Metrics" pour voir les performances
3. **Events** : Cliquez sur "Events" pour voir les déploiements

### 5.2 Sur Vercel

1. **Logs** : Cliquez sur "Logs" pour voir les logs du frontend
2. **Analytics** : Cliquez sur "Analytics" pour voir les statistiques
3. **Deployments** : Cliquez sur "Deployments" pour voir l'historique

---

## 🔄 ÉTAPE 6 : Mises à jour futures

### Pour mettre à jour le backend :

1. Push les changements sur GitHub (`git push`)
2. Render déploie automatiquement
3. Attendez que le build se termine

### Pour mettre à jour le frontend :

1. Push les changements sur GitHub (`git push`)
2. Vercel déploie automatiquement
3. Attendez que le build se termine

---

## ⚠️ Problèmes courants

### Problème : Le backend ne démarre pas

**Solution** :
- Vérifiez les logs Render
- Vérifiez que toutes les variables d'environnement sont correctes
- Vérifiez que PostgreSQL et MongoDB sont accessibles

### Problème : Le frontend ne peut pas se connecter au backend

**Solution** :
- Vérifiez que `NEXT_PUBLIC_API_URL` pointe vers l'URL Render correcte
- Vérifiez que le backend est en ligne (testez `/health`)
- Vérifiez les CORS dans le backend

### Problème : Le frontend se compile mais n'affiche rien

**Solution** :
- Vérifiez le Root Directory est `frontend`
- Vérifiez que le build command est `npm run build`
- Vérifiez les logs Vercel

---

## 📞 Support

- **Render Docs** : https://render.com/docs
- **Vercel Docs** : https://vercel.com/docs
- **GitHub Repo** : https://github.com/florian-billon/voisins-connect

---

## ✅ Check-list de déploiement

- [ ] Backend déployé sur Render
- [ ] Frontend déployé sur Vercel
- [ ] Variables d'environnement configurées sur Render
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Backend health check OK
- [ ] Frontend accessible
- [ ] Login fonctionne
- [ ] Création de groupe fonctionne
- [ ] Création de salon fonctionne
- [ ] Messages fonctionnent

---

**Bonne chance avec le déploiement ! 🚀**
