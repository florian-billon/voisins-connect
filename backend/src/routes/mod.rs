pub mod auth;
pub mod channels;
pub mod dm;
pub mod friends;
pub mod invites;
pub mod messages;
pub mod servers;
pub mod upload;
pub mod voice;
pub mod profile;
pub mod stripe;
pub mod s3;

use crate::AppState;
use axum::Router;

pub fn create_router() -> Router<AppState> {
    Router::new()
        .nest("/servers", servers::routes( })
        .merge(channels::routes( })
        .merge(messages::routes( })
        .merge(invites::routes( })
        .merge(friends::routes( })
        .merge(dm::routes( })
        .merge(upload::routes( })
        .merge(voice::routes( })
        .merge(profile::routes( })
        .nest("/subscription", stripe::routes( })
        .nest("/upload", s3::routes( })
}


