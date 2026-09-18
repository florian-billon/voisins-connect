-- ============================================================
-- Hello World - PostgreSQL bootstrap schema snapshot
-- This file is the single source of truth for PostgreSQL bootstrap.
-- It must remain idempotent for both fresh databases and existing ones.
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM TYPES
DO $$ BEGIN
CREATE TYPE user_status AS ENUM ('Online', 'Offline', 'Dnd', 'Invisible');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'user_status'
          AND e.enumlabel = 'online'
    ) THEN
        ALTER TYPE user_status RENAME VALUE 'online' TO 'Online';
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'user_status'
          AND e.enumlabel = 'offline'
    ) THEN
        ALTER TYPE user_status RENAME VALUE 'offline' TO 'Offline';
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'user_status'
          AND e.enumlabel = 'dnd'
    ) THEN
        ALTER TYPE user_status RENAME VALUE 'dnd' TO 'Dnd';
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'user_status'
          AND e.enumlabel = 'invisible'
    ) THEN
        ALTER TYPE user_status RENAME VALUE 'invisible' TO 'Invisible';
    END IF;
END;
$$;

DO $$ BEGIN
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(32) NOT NULL CHECK (username = btrim(username)) CHECK (char_length(username) BETWEEN 1 AND 32),
    avatar_url VARCHAR(500),
    apartment_number VARCHAR(20),
    status user_status NOT NULL DEFAULT 'Offline',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SERVERS
CREATE TABLE IF NOT EXISTS servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SERVER MEMBERS
CREATE TABLE IF NOT EXISTS server_members (
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role member_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (server_id, user_id)
);

-- CHANNELS
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INVITES
CREATE TABLE IF NOT EXISTS invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ,
    max_uses INT,
    uses INT NOT NULL DEFAULT 0,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

UPDATE users
SET username = btrim(username)
WHERE username <> btrim(username);

ALTER TABLE users
ALTER COLUMN username TYPE VARCHAR(32);

ALTER TABLE users
ALTER COLUMN status SET DEFAULT 'Offline';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_users_username_trimmed'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT chk_users_username_trimmed
        CHECK (username = btrim(username));
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_users_username_length'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT chk_users_username_length
        CHECK (char_length(username) BETWEEN 1 AND 32);
    END IF;
END;
$$;

-- INDEXES (idempotent)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_normalized ON users (lower(btrim(username)));
CREATE INDEX IF NOT EXISTS idx_servers_owner ON servers(owner_id);
CREATE INDEX IF NOT EXISTS idx_servers_owner_name_normalized ON servers(owner_id, lower(btrim(name)));
CREATE INDEX IF NOT EXISTS idx_server_members_user ON server_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channels_server ON channels(server_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_server ON invites(server_id);

UPDATE servers
SET name = btrim(name)
WHERE name <> btrim(name);

CREATE OR REPLACE FUNCTION prevent_duplicate_server_name_per_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM servers s
        WHERE s.owner_id = NEW.owner_id
          AND lower(btrim(s.name)) = lower(btrim(NEW.name))
          AND s.id <> NEW.id
    ) THEN
        RAISE EXCEPTION 'Duplicate server name for owner'
            USING ERRCODE = '23505',
                  CONSTRAINT = 'servers_owner_name_unique_live';
    END IF;

    NEW.name := btrim(NEW.name);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_servers_prevent_duplicate_name_per_owner ON servers;

CREATE TRIGGER trg_servers_prevent_duplicate_name_per_owner
BEFORE INSERT OR UPDATE OF name, owner_id ON servers
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_server_name_per_owner();

-- SERVER BANS (temporaire ou permanent)
CREATE TABLE IF NOT EXISTS server_bans (
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    banned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(500),
    expires_at TIMESTAMPTZ,
    banned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (server_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_server_bans_user ON server_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_server_bans_server ON server_bans(server_id);
CREATE INDEX IF NOT EXISTS idx_server_bans_expires ON server_bans(expires_at);

-- SERVER MUTES (temporary message blocking)
CREATE TABLE IF NOT EXISTS server_mutes (
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    muted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(500),
    muted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (server_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_server_mutes_user ON server_mutes(user_id);
CREATE INDEX IF NOT EXISTS idx_server_mutes_server ON server_mutes(server_id);
CREATE INDEX IF NOT EXISTS idx_server_mutes_expires ON server_mutes(expires_at);

-- DIRECT MESSAGES (private conversations)
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (user1_id <> user2_id)
);

-- Canonical uniqueness for a pair of users, independent of insertion order
CREATE UNIQUE INDEX IF NOT EXISTS uq_direct_messages_user_pair
ON direct_messages (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id));

CREATE INDEX IF NOT EXISTS idx_direct_messages_user1 ON direct_messages(user1_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_user2 ON direct_messages(user2_id);

-- FRIENDSHIPS
CREATE TABLE IF NOT EXISTS friendships (
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user1_id, user2_id),
    CHECK (user1_id <> user2_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_friendships_user_pair
ON friendships (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id));

CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user1_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user2_id);

-- NOTE: Channel messages and direct message items are stored in MongoDB, not PostgreSQL

-- ATTACHMENTS (catalogue des fichiers uploadés)
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- UUID-based storage name
    content_type VARCHAR(100),
    file_size BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_sender ON attachments(sender_id);

-- ============================================================
-- NEW FEATURES: Moderation, Voice Calls, Voice Channels, Premium
-- ============================================================

-- ENUM for subscription status
DO $$ BEGIN
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- USER SUBSCRIPTIONS (for premium features)
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    status subscription_status NOT NULL DEFAULT 'inactive',
    plan_name VARCHAR(50) NOT NULL DEFAULT 'pro', -- 'pro' = 5€/month
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON user_subscriptions(expires_at);

-- MODERATION RULES
CREATE TABLE IF NOT EXISTS moderation_rules (
    id SERIAL PRIMARY KEY,
    rule_type VARCHAR(50) NOT NULL, -- 'insult', 'harassment', 'spam'
    keywords TEXT[] NOT NULL, -- Array of keywords to detect
    action VARCHAR(50) NOT NULL DEFAULT 'flag', -- 'flag', 'hide', 'remove'
    severity INT NOT NULL DEFAULT 1, -- 1-5 scale
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MODERATED MESSAGES (for auto-moderation logging)
CREATE TABLE IF NOT EXISTS moderated_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id UUID,
    dm_id UUID,
    rule_type VARCHAR(50) NOT NULL, -- 'insult', 'harassment', 'spam'
    severity INT NOT NULL,
    action_taken VARCHAR(50) NOT NULL, -- 'flag', 'hide', 'remove'
    original_content TEXT,
    is_visible BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderated_messages_user ON moderated_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_moderated_messages_channel ON moderated_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_moderated_messages_dm ON moderated_messages(dm_id);
CREATE INDEX IF NOT EXISTS idx_moderated_messages_created ON moderated_messages(created_at);

-- VOICE CHANNELS (Premium feature)
CREATE TABLE IF NOT EXISTS voice_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    max_users INT DEFAULT 0, -- 0 = unlimited
    is_premium_only BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_channels_server ON voice_channels(server_id);

-- VOICE CALLS (Free feature)
CREATE TABLE IF NOT EXISTS voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    voice_channel_id UUID REFERENCES voice_channels(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'ended', 'rejected'
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INT,
    signal_data JSONB, -- Store WebRTC signaling data
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (initiator_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_calls_initiator ON voice_calls(initiator_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_recipient ON voice_calls(recipient_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_status ON voice_calls(status);
CREATE INDEX IF NOT EXISTS idx_voice_calls_channel ON voice_calls(voice_channel_id);

-- PROFILE UPLOADS (Premium feature for custom avatar)
CREATE TABLE IF NOT EXISTS profile_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    content_type VARCHAR(100),
    file_size BIGINT,
    is_current BOOLEAN NOT NULL DEFAULT FALSE, -- Currently active avatar
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_uploads_user ON profile_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_uploads_current ON profile_uploads(user_id, is_current);
