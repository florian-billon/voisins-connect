# Nouvelles Fonctionnalités - Documentation

Ce document décrit les nouvelles fonctionnalités ajoutées à l'application Hello World Messagerie.

## Fonctionnalités Gratuites

### 1. Auto-modération (Insultes, Harcèlement, Spam)

La modération automatique détecte et signale les messages contenant des insultes, du harcèlement, ou du spam.

#### Architecture Backend
- **Modèle**: `ModeratedMessage`, `ModerationRule` dans `backend/src/models/moderation.rs`
- **Repository**: `ModerationRepository` dans `backend/src/repositories/moderation.rs`
- **Service**: `backend/src/services/moderation.rs` avec fonctions :
  - `initialize_rules()` - Initialise les règles de modération par défaut
  - `check_message()` - Vérifie si un message viole les règles
  - `log_moderated_message()` - Enregistre un message modéré

#### Utilisation
```rust
// Vérifier un message
let result = services::moderation::check_message(&repo, "message content").await?;
if !result.is_clean {
    // Log the violation
    services::moderation::log_moderated_message(...).await?;
}
```

#### Règles Par Défaut
- **Insultes**: stupid, idiot, dumb, moron, imbécile, con, débile (action: flag, sévérité: 2)
- **Harcèlement**: kill yourself, go die, you deserve (action: hide, sévérité: 4)
- **Spam**: http, https (action: flag, sévérité: 1)

### 2. Appel Vocal (Gratuit)

Permet aux utilisateurs de passer des appels vocaux directs (1-to-1 ou via salons vocaux).

#### Architecture Backend
- **Modèle**: `VoiceCall` dans `backend/src/models/voice.rs`
- **Repository**: `VoiceRepository` dans `backend/src/repositories/voice.rs`
- **Service**: `backend/src/services/voice.rs` avec fonctions :
  - `initiate_call()` - Initie un appel
  - `accept_call()` - Accepte un appel
  - `reject_call()` - Refuse un appel
  - `end_call()` - Termine un appel
  - `get_user_recent_calls()` - Récupère l'historique d'appels

#### Routes API
- `POST /api/calls` - Initier un appel
- `GET /api/calls` - Lister les appels de l'utilisateur
- `GET /api/calls/:call_id` - Obtenir les détails d'un appel
- `POST /api/calls/:call_id/accept` - Accepter un appel
- `POST /api/calls/:call_id/reject` - Refuser un appel
- `POST /api/calls/:call_id/end` - Terminer un appel

#### Frontend
- Hook: `useVoiceCalls()` dans `frontend/hooks/useVoiceCalls.ts`
- Composant: `<VoiceCallsList />` dans `frontend/components/chat/VoiceCallsList.tsx`

## Fonctionnalités Premium (5€/mois)

### 1. Création de Salon Vocal

Permet aux propriétaires de serveur de créer des salons vocaux pour les appels en groupe.

#### Architecture Backend
- **Modèle**: `VoiceChannel` dans `backend/src/models/voice.rs`
- **Service**: Fonctions dans `backend/src/services/voice.rs` :
  - `create_voice_channel()`
  - `list_server_voice_channels()`
  - `update_voice_channel()`
  - `delete_voice_channel()`

#### Routes API
- `POST /api/servers/:server_id/voice-channels` - Créer un salon vocal
- `GET /api/servers/:server_id/voice-channels` - Lister les salons vocaux du serveur
- `PUT /api/servers/:server_id/voice-channels/:channel_id` - Modifier un salon vocal
- `DELETE /api/servers/:server_id/voice-channels/:channel_id` - Supprimer un salon vocal

### 2. Upload de Photo de Profil

Permet aux utilisateurs premium d'importer et gérer des photos de profil.

#### Architecture Backend
- **Modèle**: `ProfileUpload` dans `backend/src/models/profile.rs`
- **Repository**: `ProfileRepository` dans `backend/src/repositories/profile.rs`
- **Service**: `backend/src/services/profile.rs` avec fonctions :
  - `create_profile_upload()` - Créer un nouvel upload
  - `get_user_profile_uploads()` - Lister les uploads d'un utilisateur
  - `get_current_avatar()` - Obtenir l'avatar courant
  - `set_current_avatar()` - Définir l'avatar courant
  - `delete_profile_upload()` - Supprimer un upload

#### Routes API
- `POST /api/profile/uploads` - Créer un nouvel upload
- `GET /api/profile/uploads` - Lister les uploads de l'utilisateur
- `PUT /api/profile/uploads/set-current` - Définir l'avatar courant
- `DELETE /api/profile/uploads/:upload_id` - Supprimer un upload

#### Frontend
- Hook: `useProfileUploads()` dans `frontend/hooks/useProfileUploads.ts`
- Composant: `<ProfileAvatarUpload />` dans `frontend/components/profile/ProfileAvatarUpload.tsx`

### 3. Gestion des Abonnements

Pour tracker les utilisateurs premium et vérifier leur status.

#### Architecture Backend
- **Modèle**: `UserSubscription` dans `backend/src/models/subscription.rs`
- **Repository**: `SubscriptionRepository` dans `backend/src/repositories/subscription.rs`
- **Service**: `backend/src/services/subscription.rs` avec fonctions :
  - `get_user_subscription()` - Obtenir l'abonnement d'un utilisateur
  - `activate_premium()` - Activer l'abonnement premium (30 jours)
  - `cancel_subscription()` - Annuler l'abonnement
  - `is_premium()` - Vérifier si l'utilisateur est premium

#### Tables PostgreSQL
```sql
-- user_subscriptions
- id (UUID)
- user_id (UUID) UNIQUE
- status (subscription_status: active, inactive, cancelled)
- plan_name (VARCHAR: 'pro')
- started_at (TIMESTAMPTZ)
- expires_at (TIMESTAMPTZ)
- stripe_subscription_id (VARCHAR, optional)
- created_at, updated_at (TIMESTAMPTZ)

-- moderation_rules
- id (SERIAL)
- rule_type (VARCHAR: 'insult', 'harassment', 'spam')
- keywords (TEXT[])
- action (VARCHAR: 'flag', 'hide', 'remove')
- severity (INT: 1-5)
- enabled (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)

-- moderated_messages
- id (UUID)
- message_id (UUID, optional)
- user_id (UUID)
- channel_id (UUID, optional)
- dm_id (UUID, optional)
- rule_type (VARCHAR)
- severity (INT)
- action_taken (VARCHAR)
- original_content (TEXT, optional)
- is_visible (BOOLEAN)
- reviewed_by (UUID, optional)
- reviewed_at (TIMESTAMPTZ, optional)
- created_at (TIMESTAMPTZ)

-- voice_calls
- id (UUID)
- initiator_id (UUID)
- recipient_id (UUID)
- voice_channel_id (UUID, optional)
- status (VARCHAR: 'pending', 'active', 'ended', 'rejected')
- started_at (TIMESTAMPTZ, optional)
- ended_at (TIMESTAMPTZ, optional)
- duration_seconds (INT, optional)
- signal_data (JSONB, optional)
- created_at, updated_at (TIMESTAMPTZ)

-- voice_channels
- id (UUID)
- server_id (UUID)
- name (VARCHAR)
- position (INT)
- max_users (INT, optional)
- is_premium_only (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)

-- profile_uploads
- id (UUID)
- user_id (UUID)
- file_path (VARCHAR)
- content_type (VARCHAR, optional)
- file_size (BIGINT, optional)
- is_current (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

## Intégration NextJS

### Utilisation dans les composants

```tsx
import { useVoiceCalls, useProfileUploads } from '@/hooks';

export function MyComponent() {
  // Voice calls
  const { calls, initiateCall, acceptCall } = useVoiceCalls();
  
  // Profile uploads
  const { uploads, uploadProfileImage, setCurrentAvatar } = useProfileUploads();
  
  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

## Prochaines étapes

1. **WebRTC Integration**: Implémenter WebRTC pour les appels vocaux réels
2. **File Storage**: Intégrer un service de stockage (S3, Firebase Storage, etc.)
3. **Payment Integration**: Intégrer Stripe ou autre solution de paiement
4. **Notifications**: Ajouter des notifications pour les appels entrants
5. **Permissions**: Implémenter des permissions micro/caméra
6. **UI Refinement**: Améliorer l'interface utilisateur et l'UX
