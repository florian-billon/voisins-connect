pub mod auth;
pub mod channels;
pub mod dm;
pub mod friends;
pub mod invites;
pub mod messages;
// pub mod paypal; // Supprimé - tout gratuit
pub mod profile;
pub mod s3;
pub mod servers;
// pub mod stripe; // Supprimé - tout gratuit
pub mod upload;
pub mod voice;

use crate::AppState;
use axum::Router;

pub fn create_router() -> Router<AppState> {
    Router::new()
        .nest("/servers", servers::routes())
        .merge(channels::routes())
        .merge(messages::routes())
        .merge(invites::routes())
        .merge(friends::routes())
        .merge(dm::routes())
        .merge(upload::routes())
        .merge(voice::routes())
        .merge(profile::routes())
        .nest("/upload", s3::routes())
}
