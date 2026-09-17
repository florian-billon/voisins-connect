# Variables d'environnement pour Vercel

Copiez ces variables dans votre projet Vercel (voisins-connect) :

---

## 🌐 API URL (Backend Render)

```
NEXT_PUBLIC_API_URL = https://voisins-connect.onrender.com
```

---

## 🔔 Web Push VAPID Public Key (pour notifications push futures)

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY = BMdUmXuSDj6rvdghKjGUtI7DfRQ3eUGfLnVnyet4LexV2G32gcqfV8C4SqU90JpwpkDeVi2dug6zuHj8MCYRlms
```

---

## 📋 Instructions

1. Allez sur votre projet Vercel : voisins-connect
2. Cliquez sur "Settings" → "Environment Variables"
3. Ajoutez chaque variable avec la valeur exacte ci-dessus
4. Cliquez sur "Save"
5. Redéployez automatiquement ou faites un "Redeploy"

---

## ⚠️ Important

- NEXT_PUBLIC_API_URL doit pointer vers le backend Render
- NEXT_PUBLIC_VAPID_PUBLIC_KEY est public (commence par NEXT_PUBLIC_)
- Les notifications push ne sont pas encore activées en production (juste l'infrastructure)
