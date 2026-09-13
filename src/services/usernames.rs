use sqlx::{Error as SqlxError, PgPool};
use std::collections::HashSet;
use uuid::Uuid;

const MIN_USERNAME_LENGTH: usize = 1;
const MAX_USERNAME_LENGTH: usize = 32;
const USERNAME_UNIQUE_CONSTRAINT: &str = "uq_users_username_normalized";
const USERNAME_TRIMMED_CONSTRAINT: &str = "chk_users_username_trimmed";
const USERNAME_LENGTH_CONSTRAINT: &str = "chk_users_username_length";
const USERNAME_UNIQUE_INDEX: &str = "public.uq_users_username_normalized";
const USERNAME_REPAIR_SEPARATOR: &str = "-";

#[derive(Debug, Clone, PartialEq, Eq)]
struct UsernameRepair {
    user_id: Uuid,
    username: String,
}

pub fn normalize_username(raw: &str) -> String {
    raw.trim().to_string()
}

pub fn validate_username(raw: &str) -> Result<String, String> {
    let normalized = normalize_username(raw);
    let length = normalized.chars().count();

    if !(MIN_USERNAME_LENGTH..=MAX_USERNAME_LENGTH).contains(&length) {
        return Err(format!(
            "Username must be between {} and {} characters",
            MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH
        ));
    }

    Ok(normalized)
}

pub fn is_username_unique_violation(err: &SqlxError) -> bool {
    err.as_database_error()
        .and_then(|db_err| db_err.constraint())
        .is_some_and(|constraint| constraint == USERNAME_UNIQUE_CONSTRAINT)
}

pub async fn prepare_username_normalization(pool: &PgPool) -> Result<(), SqlxError> {
    if !users_table_exists(pool).await? || username_normalization_schema_ready(pool).await? {
        return Ok(());
    }

    let mut tx = pool.begin().await?;

    sqlx::query("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE")
        .execute(&mut *tx)
        .await?;

    let users: Vec<(Uuid, String)> =
        sqlx::query_as("SELECT id, username FROM users ORDER BY created_at ASC, id ASC")
            .fetch_all(&mut *tx)
            .await?;

    let repairs = plan_username_repairs(&users);

    for repair in &repairs {
        sqlx::query("UPDATE users SET username = $1 WHERE id = $2")
            .bind(&repair.username)
            .bind(repair.user_id)
            .execute(&mut *tx)
            .await?;
    }

    tx.commit().await?;

    if !repairs.is_empty() {
        tracing::warn!(
            repaired_usernames = repairs.len(),
            "Adjusted legacy usernames before normalization migration",
        );
    }

    Ok(())
}

async fn users_table_exists(pool: &PgPool) -> Result<bool, SqlxError> {
    table_exists(pool, "public.users").await
}

async fn username_normalization_schema_ready(pool: &PgPool) -> Result<bool, SqlxError> {
    Ok(index_exists(pool, USERNAME_UNIQUE_INDEX).await?
        && constraint_exists(pool, USERNAME_TRIMMED_CONSTRAINT).await?
        && constraint_exists(pool, USERNAME_LENGTH_CONSTRAINT).await?)
}

async fn table_exists(pool: &PgPool, table_name: &str) -> Result<bool, SqlxError> {
    sqlx::query_scalar::<_, bool>("SELECT to_regclass($1) IS NOT NULL")
        .bind(table_name)
        .fetch_one(pool)
        .await
}

async fn index_exists(pool: &PgPool, index_name: &str) -> Result<bool, SqlxError> {
    table_exists(pool, index_name).await
}

async fn constraint_exists(pool: &PgPool, constraint_name: &str) -> Result<bool, SqlxError> {
    sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = $1
        )",
    )
    .bind(constraint_name)
    .fetch_one(pool)
    .await
}

fn plan_username_repairs(users: &[(Uuid, String)]) -> Vec<UsernameRepair> {
    let mut used_usernames = HashSet::new();
    let mut repairs = Vec::new();

    for (user_id, current_username) in users {
        let trimmed_username = normalize_username(current_username);
        let normalized_username = trimmed_username.to_lowercase();
        let is_valid_length =
            (MIN_USERNAME_LENGTH..=MAX_USERNAME_LENGTH).contains(&trimmed_username.chars().count());

        if !trimmed_username.is_empty()
            && is_valid_length
            && !used_usernames.contains(&normalized_username)
        {
            used_usernames.insert(normalized_username);

            if trimmed_username != *current_username {
                repairs.push(UsernameRepair {
                    user_id: *user_id,
                    username: trimmed_username,
                });
            }

            continue;
        }

        let repaired_username =
            generate_unique_username(&trimmed_username, *user_id, &used_usernames);
        used_usernames.insert(repaired_username.to_lowercase());

        if repaired_username != *current_username {
            repairs.push(UsernameRepair {
                user_id: *user_id,
                username: repaired_username,
            });
        }
    }

    repairs
}

fn generate_unique_username(
    preferred: &str,
    user_id: Uuid,
    used_usernames: &HashSet<String>,
) -> String {
    let compact_user_id = user_id.to_string().replace('-', "");
    let base_username = if preferred.trim().is_empty() {
        "user"
    } else {
        preferred.trim()
    };

    for suffix_len in [8usize, 12, 16, 20] {
        let suffix = &compact_user_id[..suffix_len];
        let root_len =
            MAX_USERNAME_LENGTH.saturating_sub(USERNAME_REPAIR_SEPARATOR.len() + suffix.len());

        if root_len == 0 {
            continue;
        }

        let candidate = format!(
            "{}{}{}",
            truncate_chars(base_username, root_len),
            USERNAME_REPAIR_SEPARATOR,
            suffix
        );

        if !used_usernames.contains(&candidate.to_lowercase()) {
            return candidate;
        }
    }

    let fallback = truncate_chars(&compact_user_id, MAX_USERNAME_LENGTH);
    if !used_usernames.contains(&fallback.to_lowercase()) {
        return fallback;
    }

    for counter in 1.. {
        let counter = counter.to_string();
        let root_len = MAX_USERNAME_LENGTH.saturating_sub(counter.len());
        let candidate = format!("{}{}", truncate_chars(&compact_user_id, root_len), counter);

        if !used_usernames.contains(&candidate.to_lowercase()) {
            return candidate;
        }
    }

    unreachable!("the username repair generator must eventually produce a unique candidate")
}

fn truncate_chars(input: &str, max_chars: usize) -> String {
    input.chars().take(max_chars).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn user_id(value: &str) -> Uuid {
        Uuid::parse_str(value).expect("test uuid should be valid")
    }

    #[test]
    fn trims_unique_usernames_without_renaming_them() {
        let users = vec![
            (
                user_id("00000000-0000-0000-0000-000000000001"),
                " Alice ".to_string(),
            ),
            (
                user_id("00000000-0000-0000-0000-000000000002"),
                "Bob".to_string(),
            ),
        ];

        let repairs = plan_username_repairs(&users);

        assert_eq!(
            repairs,
            vec![UsernameRepair {
                user_id: user_id("00000000-0000-0000-0000-000000000001"),
                username: "Alice".to_string(),
            }]
        );
    }

    #[test]
    fn renames_duplicate_normalized_usernames_after_the_first_occurrence() {
        let users = vec![
            (
                user_id("00000000-0000-0000-0000-000000000001"),
                " Alice ".to_string(),
            ),
            (
                user_id("00000000-0000-0000-0000-000000000002"),
                "alice".to_string(),
            ),
            (
                user_id("00000000-0000-0000-0000-000000000003"),
                "ALICE".to_string(),
            ),
        ];

        let repairs = plan_username_repairs(&users);

        assert_eq!(
            repairs,
            vec![
                UsernameRepair {
                    user_id: user_id("00000000-0000-0000-0000-000000000001"),
                    username: "Alice".to_string(),
                },
                UsernameRepair {
                    user_id: user_id("00000000-0000-0000-0000-000000000002"),
                    username: "alice-00000000".to_string(),
                },
                UsernameRepair {
                    user_id: user_id("00000000-0000-0000-0000-000000000003"),
                    username: "ALICE-000000000000".to_string(),
                },
            ]
        );
    }

    #[test]
    fn repairs_empty_and_too_long_usernames() {
        let users = vec![
            (
                user_id("00000000-0000-0000-0000-000000000001"),
                "   ".to_string(),
            ),
            (
                user_id("00000000-0000-0000-0000-000000000002"),
                "abcdefghijklmnopqrstuvwxyz1234567890".to_string(),
            ),
        ];

        let repairs = plan_username_repairs(&users);

        assert_eq!(repairs[0].username, "user-00000000");
        assert!(repaired_username_is_valid(&repairs[1].username));
        assert_ne!(
            repairs[0].username.to_lowercase(),
            repairs[1].username.to_lowercase()
        );

        fn repaired_username_is_valid(username: &str) -> bool {
            let length = username.chars().count();
            (MIN_USERNAME_LENGTH..=MAX_USERNAME_LENGTH).contains(&length)
        }
    }
}
