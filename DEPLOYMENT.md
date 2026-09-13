# Guide de déploiement - voisins_connect

## 📋 Prérequis

- Compte GitHub
- Compte Vercel (pour le frontend)
- Compte Render (pour le backend)

## 🚀 Étape 1 : Déployer le Backend (Render)

1. **Connectez-vous à Render** : https://render.com
2. **Créez un nouveau Web Service** :
   - Cliquez sur "New +" → "Web Service"
   - Connectez votre dépôt GitHub
   - Sélectionnez le dossier `backend`
   - Configurez :
     - **Name** : `voisins-connect-backend`
     - **Runtime** : Docker
     - **Branch** : `main`
     - **Root Directory** : `backend`
3. **Configurez les variables d'environnement** :
   - `DATABASE_URL` : Votre URL Neon PostgreSQL
   - `MONGODB_URL` : Votre URL MongoDB Atlas
   - `JWT_SECRET` : Une clé secrète (générée automatiquement)
   - `PORT` : `3001`
4. **Cliquez sur "Deploy"**

Une fois le déploiement terminé, Render vous donnera une URL comme :
`https://voisins-connect-backend.onrender.com`

## 🎨 Étape 2 : Déployer le Frontend (Vercel)

1. **Connectez-vous à Vercel** : https://vercel.com
2. **Importez le projet** :
   - Cliquez sur "Add New Project"
   - Importez votre dépôt GitHub
   - Sélectionnez le dossier `frontend`
3. **Configurez le projet** :
   - **Framework Preset** : Next.js
   - **Root Directory** : `frontend`
   - **Environment Variables** :
     - `NEXT_PUBLIC_API_URL` : URL de votre backend Render (ex: `https://voisins-connect-backend.onrender.com`)
4. **Cliquez sur "Deploy"**

Une fois le déploiement terminé, Vercel vous donnera une URL comme :
`https://voisins-connect.vercel.app`

## 📱 Étape 3 : Tester l'application

1. Ouvrez l'URL Vercel dans votre navigateur
2. Testez l'inscription et la connexion
3. Vérifiez que le backend est accessible
4. Testez la création de groupes et de messages

## 🔧 Étape 4 : Configurer CORS (si nécessaire)

Si vous avez des erreurs CORS, ajoutez l'URL Vercel dans la configuration CORS du backend.

## 📱 Installation mobile

Les voisins peuvent installer l'application comme une PWA :
- **Android (Chrome)** : Menu → "Ajouter à l'écran d'accueil"
- **iOS (Safari)** : Partage → "Sur l'écran d'accueil"

## 🔐 Sécurité

**IMPORTANT** : Après le déploiement, changez les secrets :
- Regénérez le `JWT_SECRET` dans Render
- Changez les mots de passe des bases de données si nécessaires

## 📊 Monitoring

- **Backend** : https://dashboard.render.com
- **Frontend** : https://vercel.com/dashboard

## 💰 Coûts

Avec les plans gratuits :
- **Render** : Gratuit (limites de temps d'inactivité)
- **Vercel** : Gratuit (100GB bande passante/mois)

Pour une utilisation intensive, envisagez les plans payants.
