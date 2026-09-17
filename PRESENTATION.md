# Voisins Connect

Application de quartier simplifiée pour les résidents d'immeubles neufs.

## 🏠 À propos

Voisins Connect est une application gratuite et conviviale conçue pour faciliter la communication entre voisins dans les immeubles résidentiels nouvellement construits. Elle permet aux résidents de se connecter, d'échanger, et de s'organiser facilement depuis leur mobile.

## ✨ Fonctionnalités principales

### Communication
- **Groupes de voisins** : Créez des groupes pour votre immeuble ou votre quartier
- **Salons thématiques** : Organisez les discussions par thèmes (général, entraide, événements, sports, jeux, etc.)
- **Messages en temps réel** : Chat instantané avec notifications
- **Messages privés** : Communication directe entre voisins

### Gestion de communauté
- **Invitations** : Invitez facilement vos voisins via des liens d'invitation
- **Rôles administratifs** : Les créateurs de groupes peuvent gérer la communauté
- **Modération** : Les administrateurs peuvent supprimer/modifier les messages inappropriés

### Expérience utilisateur
- **Mobile-first** : Interface optimisée pour smartphones (320-375px)
- **Responsive** : S'adapte à tous les écrans
- **Français** : Interface entièrement en français
- **Simple** : Pas de fonctionnalités complexes, uniquement l'essentiel
- **PWA** : Installable comme application native

## 🎯 Public cible

- Résidents d'immeubles neufs
- Voisins souhaitant faciliter la communication
- Communautés locales cherchant une solution simple
- Locataires récents voulant intégrer leur quartier

## 💡 Cas d'usage

- **Présentations** : Se présenter aux nouveaux voisins
- **Entraide** : Demander/prêter des objets, services
- **Événements** : Organiser des événements de quartier
- **Infos pratiques** : Partager des informations sur l'immeuble
- ** Loisirs** : Trouver des voisins avec des centres d'intérêt communs

## 🚀 Technologies

### Frontend
- **Next.js 16** : Framework React moderne
- **TypeScript** : Typage statique
- **Tailwind CSS** : Design system
- **WebSocket** : Communication en temps réel

### Backend
- **Rust** : Performant et sécurisé
- **Axum** : Framework web async
- **PostgreSQL (Neon)** : Base de données relationnelle
- **MongoDB Atlas** : Stockage des messages
- **WebSocket** : Gateway temps réel

### Déploiement
- **Frontend** : Vercel
- **Backend** : Render
- **Base de données** : Neon PostgreSQL
- **Stockage** : MongoDB Atlas

## 📱 Installation

### Pour les utilisateurs

1. **Sur mobile** : Visitez `https://frontend-fm1n.vercel.app/`
2. **Installez** : Ajoutez à l'écran d'accueil (PWA)
3. **Créez un compte** : Entrez votre nom, email et mot de passe
4. **Connectez-vous** : Utilisez vos identifiants
5. **Créez un groupe** : Commencez à inviter vos voisins

### Pour les développeurs

```bash
# Cloner le repository
git clone https://github.com/florian-billon/voisins-connect.git

# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
cargo run
```

## 🔒 Sécurité

- **Authentification JWT** : Tokens sécurisés
- **HTTPS** : Connexions chiffrées
- **Validation des données** : Protection contre les injections
- **Modération** : Filtres de contenu inapproprié
- **Rôles** : Permissions granulaires (Owner, Admin, Member)

## 🌐 Architecture

```
┌─────────────┐
│   Frontend  │ (Next.js - Vercel)
│  (Mobile)   │
└──────┬──────┘
       │ HTTPS/WSS
       ▼
┌─────────────┐
│   Backend   │ (Rust - Render)
│   Gateway   │
└──────┬──────┘
       │
       ├──────────┬──────────┐
       ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│PostgreSQL│ │ MongoDB  │ │WebSocket│
│  (Neon)  │ │ (Atlas)  │ │ Gateway  │
└──────────┘ └──────────┘ └──────────┘
```

## 📊 Statistiques

- **Utilisateurs simultanés** : Plusieurs voisins connectés en même temps
- **Multi-appareils** : Fonctionne sur mobile, tablette et desktop
- **Temps réel** : Messages livrés instantanément
- **Disponibilité** : 24/7 grâce au cloud

## 🎨 Design

- **Palette de couleurs** : Bleu cyan (#4fdfff) sur fond sombre
- **Logo** : Voisins Connect personnalisé
- **Background** : Nuages stylisés
- **Typographie** : Lisible et moderne
- **Accessibilité** : Contraste élevé, texte clair

## 🛣️ Roadmap

### Version actuelle (v1.0)
- ✅ Groupes et salons
- ✅ Messages en temps réel
- ✅ Messages privés
- ✅ Invitations
- ✅ Modération admin
- ✅ Mobile responsive

### Futures améliorations
- [ ] Notifications push
- [ ] Partage de fichiers
- [ ] Sondages
- [ ] Événements avec RSVP
- [ ] Annonces importantes
- [ ] Signalement de problèmes

## 📞 Support

Pour toute question ou problème :
- **Email** : support@voisins-connect.app
- **GitHub** : https://github.com/florian-billon/voisins-connect
- **Documentation** : https://github.com/florian-billon/voisins-connect/wiki

## 📄 Licence

Application propriétaire. Tous droits réservés.

## 🙏 Remerciements

Développé avec ❤️ pour faciliter la vie de quartier.

---

**Voisins Connect** - Connectez-vous avec vos voisins
