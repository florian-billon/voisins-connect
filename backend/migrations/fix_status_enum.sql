-- Fix user_status enum values from uppercase to lowercase
-- This script must be executed on Neon after updating the Rust code

-- Step 1: Add new lowercase values to the enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'user_status'
          AND e.enumlabel = 'online'
    ) THEN
        ALTER TYPE user_status ADD VALUE 'online' AFTER 'Invisible';
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'user_status'
          AND e.enumlabel = 'offline'
    ) THEN
        ALTER TYPE user_status ADD VALUE 'offline' AFTER 'online';
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'user_status'
          AND e.enumlabel = 'dnd'
    ) THEN
        ALTER TYPE user_status ADD VALUE 'dnd' AFTER 'offline';
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'user_status'
          AND e.enumlabel = 'invisible'
    ) THEN
        ALTER TYPE user_status ADD VALUE 'invisible' AFTER 'dnd';
    END IF;
END;
$$;

-- Step 2: Update all users to use lowercase values
UPDATE users SET status = 'online'::user_status WHERE status = 'Online'::user_status;
UPDATE users SET status = 'offline'::user_status WHERE status = 'Offline'::user_status;
UPDATE users SET status = 'dnd'::user_status WHERE status = 'Dnd'::user_status;
UPDATE users SET status = 'invisible'::user_status WHERE status = 'Invisible'::user_status;

-- Step 3: Remove old uppercase values (requires PostgreSQL 12+)
-- Since Neon uses PostgreSQL 15+, we can rename the values

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'user_status'
          AND e.enumlabel = 'Online'
    ) THEN
        ALTER TYPE user_status RENAME VALUE 'Online' TO 'online_old';
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
          AND e.enumlabel = 'Offline'
    ) THEN
        ALTER TYPE user_status RENAME VALUE 'Offline' TO 'offline_old';
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
          AND e.enumlabel = 'Dnd'
    ) THEN
        ALTER TYPE user_status RENAME VALUE 'Dnd' TO 'dnd_old';
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
          AND e.enumlabel = 'Invisible'
    ) THEN
        ALTER TYPE user_status RENAME VALUE 'Invisible' TO 'invisible_old';
    END IF;
END;
$$;

-- Step 4: Clean up old renamed values
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'user_status'
          AND e.enumlabel = 'online_old'
    ) THEN
        ALTER TYPE user_status RENAME VALUE 'online_old' TO 'online';
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
          AND e.enumlabel = 'offline_old'
    ) THEN
        ALTER TYPE user_status RENAME VALUE 'offline_old' TO 'offline';
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
          AND e.enumlabel = 'dnd_old'
    ) THEN
        ALTER TYPE user_status RENAME VALUE 'dnd_old' TO 'dnd';
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
          AND e.enumlabel = 'invisible_old'
    ) THEN
        ALTER TYPE user_status RENAME VALUE 'invisible_old' TO 'invisible';
    END IF;
END;
$$;
