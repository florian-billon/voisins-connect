# Priorisation MoSCoW - Hello World RTC

Application de messagerie instantanée Discord-like.

## 1. Objectif

Hello World est une application de messagerie instantanée permettant :
- Rejoindre plusieurs serveurs
- Échanger via des canaux textuels
- Système de rôles (Owner / Admin / Member)
- Fonctionnalités temps réel (messages, présence, typing)

---

## 2. Périmètre fonctionnel

### 2.1 MVP (Must Have)

#### Gestion des utilisateurs
- Inscription et authentification (email/mot de passe) en JWT
- Gestion du profil utilisateur :
  - Pseudonyme
  - Avatar
  - Statut (Online/Offline/DND/Invisible)

#### Gestion des serveurs et canaux
- Creation, modification et suppression de serveurs
- Rejoindre un serveur via code d'invitation
- Quitter un serveur (sauf Owner)
- Creation, modification et suppression de canaux textuels

#### Rôles et permissions (RBAC)

| Rôle | Permissions |
|------|-------------|
| **Owner** | Contrôle total, gestion des rôles, transfert de propriété, ne peut pas quitter |
| **Admin** | Gestion des canaux, suppression messages membres, création invitations |
| **Member** | Lecture/envoi messages, suppression ses propres messages |

**Contrainte** : Un seul Owner par serveur.

#### Messagerie et temps réel
- Messages en temps reel dans les canaux
- Historique persistant avec pagination (infinite scroll)
- Indicateurs temps reel :
  - Utilisateurs connectés par serveur
  - Typing indicator dans un canal
  - Statut online/offline

#### Administration
- Moderation basique : suppression de messages (Admin)
- ⚡ Gestion des membres : expulsion (kick) - *bonus*

### 2.2 V2 (Should Have / Could Have)
- 📎 Upload fichiers (images/audio/vidéo) + preview
- 📞 Appels vocaux/vidéo (WebRTC)
- 🔐 OAuth (Google/GitHub)
- 🔍 Recherche dans l'historique des messages
- Mentions et reactions emoji

---

## 3. Interface utilisateur (UI/UX)

### 3.1 Principes UX
- Application fluide type SPA (pas de rechargements)
- Respect des standards UX
- Absence de dark patterns :
  - Confirmations explicites (leave server, delete)
  - Libellés clairs
  - Actions réversibles si possible (soft delete)

### 3.2 Pages principales
1. **Landing page** - Présentation
2. **Login / Register** - Authentification
3. **Dashboard** - Messagerie

### 3.3 Structure du dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER                               │
├──────────┬──────────┬─────────────────────────┬─────────────┤
│          │          │                         │             │
│ SERVEURS │  CANAUX  │      MESSAGES           │  MEMBRES    │
│          │          │                         │             │
│          │          │                         │ Connectés   │
│          │          │                         │             │
│          │          ├─────────────────────────┤             │
│          │          │   CHAMP DE SAISIE       │             │
└──────────┴──────────┴─────────────────────────┴─────────────┘
```

---

## 4. Stack technique

| Composant | Technologie |
|-----------|-------------|
| **Frontend** | Next.js (React) + TypeScript + Tailwind |
| **Backend** | Rust + Axum (Tokio) |
| **API** | REST + WebSocket |
| **BDD relationnelle** | PostgreSQL |
| **BDD documents** | MongoDB |

### Justification approche polyglotte

| Base | Utilisation | Avantage |
|------|-------------|----------|
| **PostgreSQL** | Utilisateurs, serveurs, rôles, membres, canaux, invitations | Intégrité transactionnelle, contraintes fortes |
| **MongoDB** | Historique des messages, logs | Performance, scalabilité, données volumineuses |

---

## 5. Légende MoSCoW

| Priorité | Description |
|----------|-------------|
| **Must Have** | Indispensable pour le MVP |
| ⚡ **Should Have** | Important mais pas bloquant |
| 📎 **Could Have** | Souhaitable si temps disponible |
| **Won't Have** | Hors perimetre pour cette version |

