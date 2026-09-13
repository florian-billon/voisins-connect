use sqlx::PgPool;

const POSTGRES_BOOTSTRAP_SQL: &str = include_str!("../../migrations/init.sql");

pub async fn apply_postgres_bootstrap(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::raw_sql(POSTGRES_BOOTSTRAP_SQL).execute(pool).await?;
    Ok(())
}
