use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Statut de présence utilisateur
#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type, PartialEq, Eq, Default)]
#[sqlx(type_name = "user_status")]
#[serde(rename_all = "lowercase")]
pub enum UserStatus {
    #[sqlx(rename = "Online")]
    Online,

    #[sqlx(rename = "Offline")]
    #[default]
    Offline,

    #[sqlx(rename = "Dnd")]
    Dnd,

    #[sqlx(rename = "Invisible")]
    Invisible,
}
/// Modèle User (PostgreSQL)
#[derive(Debug, Clone, Serialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)] // Ne jamais exposer le hash
    pub password_hash: String,
    pub username: String,
    pub avatar_url: Option<String>,
    pub apartment_number: Option<String>,
    pub status: UserStatus,
    pub created_at: DateTime<Utc>,
}

/// User sans le password_hash (pour les réponses API)
#[derive(Debug, Clone, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub avatar_url: Option<String>,
    pub apartment_number: Option<String>,
    pub status: UserStatus,
    pub created_at: DateTime<Utc>,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            username: user.username,
            avatar_url: user.avatar_url,
            apartment_number: user.apartment_number,
            status: user.status,
            created_at: user.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct UserSearchResponse {
    pub id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
    pub apartment_number: Option<String>,
    pub status: UserStatus,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct FriendSummary {
    pub id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
    pub apartment_number: Option<String>,
    pub status: UserStatus,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct PublicUserProfileResponse {
    pub id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
    pub apartment_number: Option<String>,
    pub status: UserStatus,
    pub created_at: DateTime<Utc>,
    pub is_self: bool,
    pub is_friend: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMePayload {
    pub username: Option<String>,
    pub avatar_url: Option<String>,
    pub apartment_number: Option<String>,
    pub status: Option<UserStatus>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PublicUserResponse {
    pub id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
    pub apartment_number: Option<String>,
    pub status: UserStatus,
    pub created_at: DateTime<Utc>,
}

impl From<User> for PublicUserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            username: user.username,
            avatar_url: user.avatar_url,
            apartment_number: user.apartment_number,
            status: user.status,
            created_at: user.created_at,
        }
    }
}

/// Payload pour l'inscription
#[derive(Debug, Deserialize)]
pub struct SignupPayload {
    pub email: String,
    pub username: String,
    pub password: String,
    pub apartment_number: Option<String>,
}

/// Payload pour la connexion
#[derive(Debug, Deserialize)]
pub struct LoginPayload {
    pub email: String,
    pub password: String,
}

/// Réponse d'authentification avec token
#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user: UserResponse,
    pub token: String,
}

/// Claims JWT
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid, // user_id
    pub email: String,
    pub exp: usize, // expiration timestamp
    pub iat: usize, // issued at
}
