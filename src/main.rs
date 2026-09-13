use axum::extract::State;
use axum::http::{header, HeaderValue, Method}; // Utilise celui d'axum, c'est plus simple
use axum::{
    middleware,
    routing::{get, post},
    Json, Router,
};
use mongodb::bson::doc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;

pub use self::error::{Error, Result};

use mongodb::{Client as MongoClient, Database as MongoDatabase};
use sqlx::postgres::PgPoolOptions;
use std::time::Duration;

mod ctx;
mod error;
mod handlers;
mod models;
mod repositories;
mod routes;
mod services;
mod web;

use repositories::{
    AttachmentRepository, ChannelRepository, DirectMessageRepository, DmRepository,
    FriendshipRepository, InviteRepository, MessageRepository, ModerationRepository,
    ProfileRepository, ServerRepository, SubscriptionRepository, UserRepository, VoiceRepository,
};
use web::MetricsSnapshot;
use web::{WsHub, WsMetrics};

const DEFAULT_DATABASE_URL: &str = "postgres://postgres:postgres@localhost:5433/helloworld";
const DEFAULT_MONGODB_URL: &str = "mongodb://localhost:27017";
const DEFAULT_ALLOWED_ORIGINS: &str =
    "https://hello-world-messagerie-jfk7.vercel.app,http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002,http://127.0.0.1:3002,tauri://localhost,http://tauri.localhost,https://tauri.localhost";
const DEFAULT_PORT: &str = "3005";
const MONGODB_STARTUP_TIMEOUT_SECS: u64 = 15;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub mongo: MongoDatabase,
    pub jwt_secret: String,
    pub user_repo: UserRepository,
    pub server_repo: ServerRepository,
    pub channel_repo: ChannelRepository,
    pub message_repo: MessageRepository,
    pub dm_message_repo: DirectMessageRepository,
    pub dm_repo: DmRepository,
    pub friendship_repo: FriendshipRepository,
    pub invite_repo: InviteRepository,
    pub attachment_repo: AttachmentRepository,
    pub subscription_repo: SubscriptionRepository,
    pub moderation_repo: ModerationRepository,
    pub voice_repo: VoiceRepository,
    pub profile_repo: ProfileRepository,
    pub s3_service: services::s3::S3Service,
    pub webrtc_service: services::webrtc::WebRTCService,
    pub ws_hub: web::WsHub,
    pub ws_metrics: web::WsMetrics,
}

async fn health() -> &'static str {
    "OK"
}

async fn root() -> &'static str {
    "Hello World backend is running. Use /health for health checks."
}

async fn get_ws_metrics(State(state): State<AppState>) -> Json<MetricsSnapshot> {
    Json(state.ws_metrics.get_metrics().await)
}

fn read_env_var(key: &str) -> Option<String> {
    std::env::var(key)
        .ok()
        .map(|value| sanitize_env_var_value(&value))
        .filter(|value| !value.is_empty())
}

fn env_var_or_default(key: &str, default: &str) -> String {
    read_env_var(key).unwrap_or_else(|| default.to_string())
}

fn sanitize_env_var_value(value: &str) -> String {
    let trimmed = value.trim();
    let unwrapped = match (
        trimmed
            .strip_prefix('"')
            .and_then(|value| value.strip_suffix('"')),
        trimmed
            .strip_prefix('\'')
            .and_then(|value| value.strip_suffix('\'')),
    ) {
        (Some(double_quoted), _) => double_quoted,
        (_, Some(single_quoted)) => single_quoted,
        _ => trimmed,
    };

    unwrapped.trim().to_string()
}

fn parse_allowed_origins(raw_origins: &str) -> Vec<HeaderValue> {
    raw_origins
        .split(',')
        .filter_map(|origin| {
            let sanitized_origin = sanitize_env_var_value(origin);

            if sanitized_origin.is_empty()
                || (!sanitized_origin.starts_with("http://")
                    && !sanitized_origin.starts_with("https://")
                    && !sanitized_origin.starts_with("tauri://"))
            {
                None
            } else {
                sanitized_origin.parse::<HeaderValue>().ok()
            }
        })
        .collect()
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    let database_url = env_var_or_default("DATABASE_URL", DEFAULT_DATABASE_URL);
    let jwt_secret =
        read_env_var("JWT_SECRET").expect("JWT_SECRET environment variable must be set");
    let port = env_var_or_default("PORT", DEFAULT_PORT);
    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind TCP listener");

    tracing::info!(addr = %addr, "TCP listener bound, continuing service startup");

    tracing::info!("Connecting to PostgreSQL");
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await
        .expect("Failed to connect to PostgreSQL");
    tracing::info!("PostgreSQL connection established");

    tracing::info!("Preparing username normalization state");
    services::usernames::prepare_username_normalization(&pool)
        .await
        .expect("Failed to prepare legacy usernames for normalization migration");
    tracing::info!("Username normalization preparation completed");

    let mongodb_url = env_var_or_default("MONGODB_URL", DEFAULT_MONGODB_URL);
    tracing::info!("Initializing MongoDB client");
    let mongo_client = tokio::time::timeout(
        Duration::from_secs(MONGODB_STARTUP_TIMEOUT_SECS),
        MongoClient::with_uri_str(&mongodb_url),
    )
    .await
    .expect("Timed out while creating MongoDB client")
    .expect("Failed to create MongoDB client");
    let mongo_db = mongo_client.database("helloworld");
    tracing::info!("Pinging MongoDB");
    tokio::time::timeout(Duration::from_secs(MONGODB_STARTUP_TIMEOUT_SECS), async {
        mongo_db.run_command(doc! { "ping": 1 }).await
    })
    .await
    .expect("Timed out while pinging MongoDB")
    .expect("Failed to ping MongoDB");
    tracing::info!("MongoDB connection established");

    let user_repo = UserRepository::new(pool.clone());
    let server_repo = ServerRepository::new(pool.clone());
    let channel_repo = ChannelRepository::new(pool.clone());
    let dm_repo = DmRepository::new(pool.clone());
    let friendship_repo = FriendshipRepository::new(pool.clone());
    let invite_repo = InviteRepository::new(pool.clone());
    let attachment_repo = AttachmentRepository::new(pool.clone());
    let subscription_repo = SubscriptionRepository::new(pool.clone());
    let moderation_repo = ModerationRepository::new(pool.clone());
    let voice_repo = VoiceRepository::new(pool.clone());
    let profile_repo = ProfileRepository::new(pool.clone());
    let message_repo = MessageRepository::new(mongo_db.clone());
    let dm_message_repo = DirectMessageRepository::new(mongo_db.clone());

    let s3_bucket = read_env_var("S3_BUCKET").expect("S3_BUCKET environment variable must be set");
    let s3_service = services::s3::S3Service::new(s3_bucket)
        .await
        .expect("Failed to initialize S3 service");

    let webrtc_service = services::webrtc::WebRTCService::new();

    let ws_hub = WsHub::new();
    let ws_metrics = WsMetrics::new();

    tracing::info!("Applying PostgreSQL bootstrap schema");
    services::bootstrap::apply_postgres_bootstrap(&pool)
        .await
        .expect("Failed to apply PostgreSQL bootstrap schema");
    tracing::info!("PostgreSQL bootstrap schema applied");

    tracing::info!("Initializing default moderation rules");
    services::moderation::initialize_rules(&moderation_repo)
        .await
        .expect("Failed to initialize moderation rules");
    tracing::info!("Default moderation rules initialized");

    let state = AppState {
        db: pool,
        mongo: mongo_db,
        jwt_secret,
        user_repo,
        server_repo,
        channel_repo,
        message_repo,
        dm_message_repo,
        dm_repo,
        friendship_repo,
        invite_repo,
        attachment_repo,
        subscription_repo,
        moderation_repo,
        voice_repo,
        profile_repo,
        s3_service,
        webrtc_service,
        ws_hub,
        ws_metrics,
    };

    tokio::spawn(async {
        let mut interval = tokio::time::interval(Duration::from_secs(5));
        loop {
            interval.tick().await;
            crate::services::realtime::typing::cleanup_typing_cache().await;
        }
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::DELETE,
            Method::PUT,
            Method::OPTIONS,
        ])
        .allow_headers([
            header::CONTENT_TYPE,
            header::AUTHORIZATION,
            header::UPGRADE,
            header::CONNECTION,
        ])
        .allow_credentials(true);

    let routes_protected = routes::create_router()
        .route(
            "/me",
            get(handlers::user::me).patch(handlers::user::update_me),
        )
        .route("/users/search", get(handlers::user_public::search_users))
        .route(
            "/users/{user_id}/profile",
            get(handlers::user_public::get_public_profile),
        )
        .route("/auth/logout", post(handlers::auth::logout))
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            web::mw_require_auth,
        ));

    let routes_public = Router::new()
        .route("/", get(root))
        .route("/health", get(health))
        .route("/ws/metrics", get(get_ws_metrics))
        .route(
            "/users/{user_id}",
            get(handlers::user_public::get_public_user),
        )
        .route("/ws", get(web::ws_handler))
        .merge(routes::auth::routes());

    let app = Router::new()
        .nest_service("/files", ServeDir::new("./uploads"))
        .merge(routes_public)
        .merge(routes_protected)
        .layer(middleware::from_fn_with_state(
            state.clone(),
            web::mw_ctx_resolver,
        ))
        .layer(cors)
        .with_state(state);

    println!("🚀 Server running on http://{}", addr);
    axum::serve(listener, app)
        .await
        .expect("Server failed to start");
}

#[cfg(test)]
mod tests {
    use super::{parse_allowed_origins, sanitize_env_var_value};

    #[test]
    fn strips_wrapping_quotes_from_env_values() {
        assert_eq!(
            sanitize_env_var_value(r#""https://example.com""#),
            "https://example.com"
        );
        assert_eq!(
            sanitize_env_var_value("'mongodb://localhost:27017'"),
            "mongodb://localhost:27017"
        );
    }

    #[test]
    fn keeps_unquoted_values_intact() {
        assert_eq!(
            sanitize_env_var_value("postgresql://user:pass@host/db?sslmode=require"),
            "postgresql://user:pass@host/db?sslmode=require"
        );
    }

    #[test]
    fn parses_allowed_origins_and_skips_invalid_values() {
        let origins = parse_allowed_origins(
            r#""https://hello-world-messagerie-jfk7.vercel.app", invalid origin, http://localhost:3002, tauri://localhost"#,
        );

        assert_eq!(origins.len(), 3);
    }
}
