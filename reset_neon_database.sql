-- ============================================================
-- SCRIPT DE RÉINITIALISATION DE LA BASE DE DONNÉES NEON
-- ⚠️ ATTENTION : CE SCRIPT SUPPRIME TOUTES LES DONNÉES
-- Exécutez ce script dans le SQL Editor Neon après avoir exporté vos données
-- ============================================================

-- 1. Supprimer toutes les tables par ordre de dépendance
DROP TABLE IF EXISTS moderated_messages CASCADE;
DROP TABLE IF EXISTS moderation_rules CASCADE;
DROP TABLE IF EXISTS profile_uploads CASCADE;
DROP TABLE IF EXISTS voice_calls CASCADE;
DROP TABLE IF EXISTS voice_channels CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS server_mutes CASCADE;
DROP TABLE IF EXISTS server_bans CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS server_members CASCADE;
DROP TABLE IF EXISTS servers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Supprimer les types enum
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS member_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;

-- 3. Supprimer les triggers
DROP TRIGGER IF EXISTS trg_servers_prevent_duplicate_name_per_owner ON servers;
DROP FUNCTION IF EXISTS prevent_duplicate_server_name_per_owner() CASCADE;

-- 4. Supprimer l'extension
DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;

-- ============================================================
-- Maintenant, exécutez le fichier init.sql pour recréer la base de données
-- ============================================================

-- Après avoir exécuté ce script, exécutez :
-- backend/migrations/init.sql
