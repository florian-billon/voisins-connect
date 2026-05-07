# Checklist de Mise en Place des Nouvelles Fonctionnalités

## ✅ Complété

### Backend
- [x] Migrations SQL (5 tables + enums)
  - user_subscriptions
  - moderation_rules
  - moderated_messages
  - voice_calls
  - voice_channels
  - profile_uploads

- [x] Modèles Rust (4 fichiers)
  - subscription.rs
  - moderation.rs
  - voice.rs
  - profile.rs

- [x] Repositories (4 fichiers)
  - subscription.rs
  - moderation.rs
  - voice.rs
  - profile.rs

- [x] Services (4 fichiers)
  - subscription.rs
  - moderation.rs
  - voice.rs
  - profile.rs

- [x] Handlers (2 fichiers)
  - voice.rs (6 handlers pour appels + 5 pour salons)
  - profile.rs (4 handlers)

- [x] Routes (2 fichiers)
  - voice.rs
  - profile.rs

### Frontend
- [x] Hooks (2 fichiers)
  - useVoiceCalls.ts
  - useProfileUploads.ts

- [x] Composants (2 fichiers)
  - VoiceCallsList.tsx
  - ProfileAvatarUpload.tsx

### Documentation
- [x] NEW_FEATURES.md avec architectur...

---

## ⏳ À Faire (Avant Production)

### 1. Implémentation WebRTC
```rust
// Ajouter support WebRTC pour les appels vocaux réels
// Utiliser libraries: webrtc-util, coturn server, etc.
```

**Priorité**: HAUTE - Nécessaire pour les appels fonctionnels

### 2. Service de Stockage Fichiers
```typescript
// Implémenter upload de fichiers vers:
// - AWS S3
// - Firebase Storage
// - MinIO (self-hosted)
```

**Priorité**: HAUTE - Pour les photos de profil

### 3. Intégration Paiement (Stripe/Paddle)
```rust
// Webhooks pour:
// - create_payment_intent
// - handle_webhook
// - update_subscription_on_success
```

**Priorité**: CRITIQUE - Pour les fonctionnalités premium

### 4. Refiner Frontend UI
- [ ] Améliorer VoiceCallsList.tsx
- [ ] Améliorer ProfileAvatarUpload.tsx
- [ ] Ajouter animations
- [ ] Tests d'accessibilité
- [ ] Mode sombre

**Priorité**: MOYENNE

### 5. Notifications
- [ ] Push notifications pour appels entrants
- [ ] Toast notifications pour actions
- [ ] WebSocket pour notifications temps réel

**Priorité**: MOYENNE

### 6. Modération Avancée
- [ ] ML-based detection (utiliser API externe)
- [ ] Admin dashboard pour review
- [ ] Appeals process

**Priorité**: BASSE

### 7. Tests
```bash
# Ajouter tests unitaires
cargo test  # Backend
npm test    # Frontend
```

**Priorité**: HAUTE

### 8. Déploiement
- [ ] Mettre à jour docker-compose.yml
- [ ] Configurer variables d'environnement
- [ ] Migrations de base de données
- [ ] Tests en staging

**Priorité**: CRITIQUE

---

## 📋 Appels API Disponibles

### Voice Calls (Gratuit)
```
POST   /api/calls
GET    /api/calls
GET    /api/calls/:call_id
POST   /api/calls/:call_id/accept
POST   /api/calls/:call_id/reject
POST   /api/calls/:call_id/end
```

### Voice Channels (Premium)
```
POST   /api/servers/:server_id/voice-channels
GET    /api/servers/:server_id/voice-channels
PUT    /api/servers/:server_id/voice-channels/:channel_id
DELETE /api/servers/:server_id/voice-channels/:channel_id
```

### Profile Uploads (Premium)
```
POST   /api/profile/uploads
GET    /api/profile/uploads
PUT    /api/profile/uploads/set-current
DELETE /api/profile/uploads/:upload_id
```

### Auto-Modération (Gratuit)
```
// Automatique lors de la création de message
// Enregistrement dans moderated_messages
```

---

## 🚀 Ordre de Déploiement Recommandé

1. **Phase 1**: Base
   - Migrer la base de données
   - Déployer le backend
   - Vérifier les endpoints

2. **Phase 2**: Fonctionnalités Gratuites
   - Déployer auto-modération
   - Tester la détection de messages
   - Déployer appels vocaux (sans WebRTC d'abord)

3. **Phase 3**: Fonctionnalités Premium
   - Intégrer Stripe
   - Déployer service de stockage
   - Déployer uploads de profil
   - Déployer salons vocaux

4. **Phase 4**: Optimisations
   - WebRTC pour appels réels
   - Notifications
   - UI refinement
   - Performance tuning

---

## 📝 Notes Importantes

### Modération
- Les mots-clés par défaut sont initialisés automatiquement
- Personnalisable via API admin (à implémenter)
- Sévérité: 1 (faible) à 5 (critique)
- Actions: flag (signaler), hide (cacher), remove (supprimer)

### Abonnements
- Premium: 5€/mois (configurable)
- Durée par défaut: 30 jours
- A connecter à Stripe pour paiements réels

### Appels Vocaux
- Gratuit pour tous les utilisateurs
- Support 1-to-1 et en groupe (via salons)
- Signaling stocké en JSONB pour WebRTC

### Photos de Profil
- Premium uniquement
- Limite: 5MB par fichier
- Formats: image/* accepté
- Une seule photo "courante" par utilisateur

---

## 🔗 Fichiers de Référence

- Backend: `docs/NEW_FEATURES.md`
- Frontend: Voir composants créés
- DB Schema: `backend/migrations/init.sql` (fin du fichier)
