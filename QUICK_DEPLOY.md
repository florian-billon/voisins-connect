# 🚀 Guide de déploiement rapide - voisins_connect

## 📋 Situation actuelle

✅ **Code pushé sur GitHub** : https://github.com/florian-billon/voisins-connect
✅ **Backend** : Configuration Docker et Render prêtes
✅ **Frontend** : Configuration Vercel prête
✅ **Fichiers de déploiement** : Créés et configurés

## 🔑 Vos identifiants de base de données (déjà configurés)

```env
DATABASE_URL="postgresql://neondb_owner:npg_iVuGFgOAzM64@ep-jolly-water-ahsgdocs-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
MONGODB_URL="mongodb+srv://helloworld:helloworld@cluster0.o2z1nqe.mongodb.net/?appName=Cluster0"
JWT_SECRET="super_secret_jwt_key_change_in_production_12345"
PORT=3001
```

## ⚠️ IMPORTANT : Sécurité

**Après le déploiement, changez ces secrets :**
- Regénérez le `JWT_SECRET` dans Render
- Changez les mots de passe des bases de données si nécessaires

## 🎯 Étape 1 : Déployer le Backend sur Render (5 minutes)

1. **Allez sur Render** : https://render.com
2. **Connectez-vous** avec votre compte GitHub
3. **Cliquez sur "New +" → "Web Service"**
4. **Connectez votre dépôt GitHub** : `florian-billon/voisins-connect`
5. **Configurez le service** :
   - **Name** : `voisins-connect-backend`
   - **Runtime** : Rust
   - **Branch** : `main`
   - **Root Directory** : Laissez vide (root du dépôt)
6. **Configurez les variables d'environnement** :
   - `DATABASE_URL` : `postgresql://neondb_owner:npg_iVuGFgOAzM64@ep-jolly-water-ahsgdocs-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require`
   - `MONGODB_URL` : `mongodb+srv://helloworld:helloworld@cluster0.o2z1nqe.mongodb.net/?appName=Cluster0`
   - `JWT_SECRET` : `super_secret_jwt_key_change_in_production_12345`
   - `PORT` : `3001`
7. **Cliquez sur "Create Web Service"**

**Note** : Le premier déploiement peut prendre 5-10 minutes.

Une fois terminé, Render vous donnera une URL comme :
`https://voisins-connect-backend.onrender.com`

## 🎨 Étape 2 : Déployer le Frontend sur Vercel (3 minutes)

1. **Allez sur Vercel** : https://vercel.com
2. **Connectez-vous** avec votre compte GitHub
3. **Cliquez sur "Add New Project"**
4. **Importez votre dépôt GitHub** : `florian-billon/voisins-connect`
5. **Configurez le projet** :
   - **Framework Preset** : Next.js
   - **Root Directory** : `frontend`
   - **Environment Variables** :
     - `NEXT_PUBLIC_API_URL` : `https://voisins-connect-backend.onrender.com` (remplacez par l'URL réelle du backend)
6. **Cliquez sur "Deploy"**

Une fois terminé, Vercel vous donnera une URL comme :
`https://voisins-connect.vercel.app`

## 📱 Étape 3 : Tester l'application

1. Ouvrez l'URL Vercel dans votre navigateur
2. Testez l'inscription et la connexion
3. Vérifiez que le backend est accessible
4. Testez la création de groupes et de messages

## 📱 Installation mobile pour vos voisins

Une fois déployé, vos voisins peuvent installer l'application :

### Android (Chrome)
1. Ouvrez l'URL Vercel sur votre téléphone
2. Menu (⋮) → "Ajouter à l'écran d'accueil"
3. L'icône voisins_connect apparaîtra sur votre écran

### iOS (Safari)
1. Ouvrez l'URL Vercel sur votre iPhone
2. Bouton Partage (↑) → "Sur l'écran d'accueil"
3. L'application s'installera comme une app native

## 💰 Coûts

**100% GRATUIT** avec les plans gratuits :
- **Render** : Gratuit (backend - limites de temps d'inactivité)
- **Vercel** : Gratuit (frontend - 100GB bande passante/mois)
- **Neon PostgreSQL** : Gratuit (limites appliquées)
- **MongoDB Atlas** : Gratuit (512MB)

## 🔧 Configuration CORS (si nécessaire)

Si vous avez des erreurs CORS, ajoutez l'URL Vercel dans la configuration CORS du backend.

## 📊 Monitoring

- **Backend** : https://dashboard.render.com
- **Frontend** : https://vercel.com/dashboard

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans Render et Vercel
2. Assurez-vous que les variables d'environnement sont correctes
3. Vérifiez que le backend est accessible avant de déployer le frontend

## 🎉 Une fois terminé

Partagez l'URL Vercel avec vos voisins ! Ils pourront :
- S'inscrire gratuitement
- Créer des groupes de quartier
- Discuter en temps réel
- Installer l'application comme une PWA mobile

**L'application sera 100% gratuite pour tous !**
