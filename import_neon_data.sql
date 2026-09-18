-- ============================================================
-- SCRIPT D'IMPORT DES DONNÉES NEON
-- À exécuter dans le SQL Editor Neon après avoir :
-- 1. Réinitialisé la base de données avec reset_neon_database.sql
-- 2. Exécuté init.sql pour recréer le schéma
-- 3. Avoir les fichiers CSV exportés
-- ============================================================

-- Remplacez les chemins par vos fichiers CSV exportés

-- 1. Import des utilisateurs
COPY users (id, email, username, avatar_url, apartment_number, status, created_at)
FROM '/path/to/users.csv' WITH CSV DELIMITER '|' HEADER;

-- 2. Import des serveurs
COPY servers (id, name, owner_id, created_at, updated_at)
FROM '/path/to/servers.csv' WITH CSV DELIMITER '|' HEADER;

-- 3. Import des membres de serveurs
COPY server_members (server_id, user_id, role, joined_at)
FROM '/path/to/server_members.csv' WITH CSV DELIMITER '|' HEADER;

-- 4. Import des canaux
COPY channels (id, server_id, name, position, created_at, updated_at)
FROM '/path/to/channels.csv' WITH CSV DELIMITER '|' HEADER;

-- 5. Import des invitations
COPY invites (id, server_id, code, created_by, expires_at, max_uses, uses, revoked, created_at)
FROM '/path/to/invites.csv' WITH CSV DELIMITER '|' HEADER;

-- 6. Import des amitiés
COPY friendships (user1_id, user2_id, created_at)
FROM '/path/to/friendships.csv' WITH CSV DELIMITER '|' HEADER;

-- 7. Import des conversations directes
COPY direct_messages (id, user1_id, user2_id, created_at)
FROM '/path/to/direct_messages.csv' WITH CSV DELIMITER '|' HEADER;

-- 8. Import des bannissements
COPY server_bans (server_id, user_id, banned_by, reason, expires_at, banned_at)
FROM '/path/to/server_bans.csv' WITH CSV DELIMITER '|' HEADER;

-- 9. Import des mutes
COPY server_mutes (server_id, user_id, muted_by, reason, muted_at, expires_at)
FROM '/path/to/server_mutes.csv' WITH CSV DELIMITER '|' HEADER;

-- 10. Import des abonnements
COPY user_subscriptions (id, user_id, status, plan_name, started_at, expires_at, stripe_subscription_id, created_at, updated_at)
FROM '/path/to/user_subscriptions.csv' WITH CSV DELIMITER '|' HEADER;

-- 11. Import des canaux vocaux
COPY voice_channels (id, server_id, name, position, max_users, is_premium_only, created_at, updated_at)
FROM '/path/to/voice_channels.csv' WITH CSV DELIMITER '|' HEADER;

-- 12. Import des appels vocaux
COPY voice_calls (id, initiator_id, recipient_id, voice_channel_id, status, started_at, ended_at, duration_seconds, created_at, updated_at)
FROM '/path/to/voice_calls.csv' WITH CSV DELIMITER '|' HEADER;
