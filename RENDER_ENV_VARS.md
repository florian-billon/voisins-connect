# Variables d'environnement pour Render

Copiez ces variables dans votre service Render (voisins-connect) :

---

## 🗄️ Base de données PostgreSQL (Neon - NOUVELLE URL)

```
DATABASE_URL = postgresql://neondb_owner:npg_osO3xDfwiIm2@ep-dry-union-aym1o38g-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## 🍃 Base de données MongoDB

```
MONGODB_URL = mongodb+srv://helloworld:helloworld@cluster0.o2z1nqe.mongodb.net/?appName=Cluster0
```

---

## 🔐 JWT Secret

```
JWT_SECRET = super_secret_jwt_key_change_in_production_12345
```

---

## 🚀 Port

```
PORT = 3001
```

---

## 📦 S3 Bucket (dummy car pas utilisé)

```
S3_BUCKET = dummy
```

---

## � Web Push VAPID Keys (pour notifications push futures)

```
VAPID_PUBLIC_KEY = BMdUmXuSDj6rvdghKjGUtI7DfRQ3eUGfLnVnyet4LexV2G32gcqfV8C4SqU90JpwpkDeVi2dug6zuHj8MCYRlms
VAPID_PRIVATE_KEY = kF7SMmZrQ9YfykUq5srXBGtPKqrT-3VZ16Q4hiu_cz0
VAPID_SUBJECT = mailto:contact@voisins-connect.app
```

---

## �📋 Instructions

1. Allez sur votre service Render : voisins-connect
2. Cliquez sur "Environment Variables"
3. Ajoutez chaque variable avec la valeur exacte ci-dessus
4. Cliquez sur "Save Changes"
5. Cliquez sur "Manual Deploy"

---

## ⚠️ Important

- Utilisez la NOUVELLE URL PostgreSQL (celle ci-dessus)
- Conservez l'URL MongoDB existante
- Le JWT_SECRET peut être changé pour plus de sécurité
- S3_BUCKET est un dummy car la fonctionnalité S3 n'est pas utilisée
- Les clés VAPID sont pour les notifications push (pas encore activées en production)
