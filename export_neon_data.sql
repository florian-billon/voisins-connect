-- ============================================================
-- SCRIPT D'EXPORT DES DONNÉES NEON
-- Exécutez ce script dans le SQL Editor Neon pour exporter toutes vos données
-- ============================================================

-- 1. Export des utilisateurs
COPY (
    SELECT 
        id::text,
        email,
        username,
        avatar_url,
        apartment_number,
        status,
        created_at::text
    FROM users
) TO STDOUT WITH CSV HEADER DELIMITER '|';

-- 2. Export des serveurs
COPY (
    SELECT 
        id::text,
        name,
        owner_id::text,
        created_at::text,
        updated_at::text
    FROM servers
) TO STDOUT WITH CSV HEADER DELIMITER '|';

-- 3. Export des membres de serveurs
COPY (
    SELECT 
        server_id::text,
        user_id::text,
        role,
        joined_at::text
    FROM server_members
) TO STDOUT WITH CSV HEADER DELIMITER '|';

-- 4. Export des canaux
COPY (
    SELECT 
        id::text,
        server_id::text,
        name,
        position,
        created_at::text,
        updated_at::text
    FROM channels
) TO STDOUT WITH CSV HEADER DELIMITER '|';

-- 5. Export des invitations
COPY (
    SELECT 
        id::text,
        server_id::text,
        code,
        created_by::text,
        expires_at::text,
        max_uses,
        uses,
        revoked,
        created_at::text
    FROM invites
) TO STDOUT WITH CSV HEADER DELIMITER '|';

-- 6. Export des amitiés
COPY (
    SELECT 
        user1_id::text,
        user2_id::text,
        created_at::text
    FROM friendships
) TO STDOUT WITH CSV HEADER DELIMITER '|';

-- 7. Export des conversations directes
COPY (
    SELECT 
        id::text,
        user1_id::text,
        user2_id::text,
        created_at::text
    FROM direct_messages
) TO STDOUT WITH CSV HEADER DELIMITER '|';

-- 8. Export des bannissements
COPY (
    SELECT 
        server_id::text,
        user_id::text,
        banned_by::text,
        reason,
        expires_at::text,
        banned_at::text
    FROM server_bans
) TO STDOUT WITH CSV HEADER DELIMITER '|';

-- 9. Export des mutes
COPY (
    SELECT 
        server_id::text,
        user_id::text,
        muted_by::text,
        reason,
        muted_at::text,
        expires_at::text
    FROM server_mutes
) TO STDOUT WITH CSV HEADER DELIMITER '|';

-- 10. Export des abonnements
COPY (
    SELECT 
        id::text,
        user_id::text,
        status,
        plan_name,
        started_at::text,
        expires_at::text,
        stripe_subscription_id,
        created_at::text,
        updated_at::text
    FROM user_subscriptions
) TO STDOUT WITH CSV HEADER DELIMITER '|';

-- 11. Export des canaux vocaux
COPY (
    SELECT 
        id::text,
        server_id::text,
        name,
        position,
        max_users,
        is_premium_only,
        created_at::text,
        updated_at::text
    FROM voice_channels
) TO STDOUT WITH CSV HEADER DELIMITER '|';

-- 12. Export des appels vocaux
COPY (
    SELECT 
        id::text,
        initiator_id::text,
        recipient_id::text,
        voice_channel_id::text,
        status,
        started_at::text,
        ended_at::text,
        duration_seconds,
        created_at::text,
        updated_at::text
    FROM voice_calls
) TO STDOUT WITH CSV HEADER DELIMITER '|';
