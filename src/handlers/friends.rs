use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use uuid::Uuid;

use crate::ctx::Ctx;
use crate::models::FriendSummary;
use crate::{AppState, Error, Result};

pub async fn list_friends(
    State(state): State<AppState>,
    ctx: Ctx,
) -> Result<Json<Vec<FriendSummary>>> {
    let friends = state.friendship_repo.list_friends(ctx.user_id()).await?;
    Ok(Json(friends))
}

pub async fn add_friend(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(friend_id): Path<Uuid>,
) -> Result<StatusCode> {
    if friend_id == ctx.user_id() {
        return Err(Error::BadRequest {
            message: "Cannot add yourself as a friend".to_string(),
        });
    }

    state
        .user_repo
        .find_by_id(friend_id)
        .await?
        .ok_or(Error::UserNotFound)?;

    state
        .friendship_repo
        .create(ctx.user_id(), friend_id)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn remove_friend(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(friend_id): Path<Uuid>,
) -> Result<StatusCode> {
    state
        .friendship_repo
        .delete(ctx.user_id(), friend_id)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}
