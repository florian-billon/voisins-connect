use axum::extract::Path;
use axum::extract::Query;
use axum::extract::State;
use axum::Json;
use serde::Deserialize;

use uuid::Uuid;

use crate::ctx::Ctx;
use crate::models::{PublicUserProfileResponse, PublicUserResponse};
use crate::AppState;
use crate::Error;
use crate::Result;

pub async fn get_public_user(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<PublicUserResponse>> {
    let user = state
        .user_repo
        .find_by_id(user_id)
        .await?
        .ok_or(Error::UserNotFound)?;
    Ok(Json(user.into()))
}

#[derive(Debug, Deserialize)]
pub struct SearchUsersQuery {
    pub q: Option<String>,
    pub limit: Option<i64>,
}

pub async fn search_users(
    State(state): State<AppState>,
    ctx: Ctx,
    Query(query): Query<SearchUsersQuery>,
) -> Result<Json<Vec<crate::models::UserSearchResponse>>> {
    let search = query.q.unwrap_or_default();
    let normalized = crate::services::usernames::normalize_username(&search);

    if normalized.is_empty() {
        return Ok(Json(vec![]));
    }

    let users = state
        .user_repo
        .search_users(
            ctx.user_id(),
            &normalized,
            query.limit.unwrap_or(8).clamp(1, 20),
        )
        .await?;

    Ok(Json(users))
}

pub async fn get_public_profile(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(user_id): Path<Uuid>,
) -> Result<Json<PublicUserProfileResponse>> {
    let user = state
        .user_repo
        .get_public_profile(user_id, ctx.user_id())
        .await?
        .ok_or(Error::UserNotFound)?;

    Ok(Json(user))
}
