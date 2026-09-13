use bson::{doc, Binary};
use chrono::Utc;
use futures::TryStreamExt;
use mongodb::Database;
use uuid::Uuid;

use crate::models::DirectMessageItem;

const COLLECTION_NAME: &str = "direct_message_items";

#[derive(Clone)]
pub struct DirectMessageRepository {
    db: Database,
}

impl DirectMessageRepository {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    fn collection(&self) -> mongodb::Collection<DirectMessageItem> {
        self.db.collection(COLLECTION_NAME)
    }

    fn uuid_to_binary(uuid: Uuid) -> Binary {
        Binary {
            subtype: bson::spec::BinarySubtype::Generic,
            bytes: uuid.as_bytes().to_vec(),
        }
    }

    fn uuid_filter(field: &str, uuid: Uuid) -> bson::Document {
        doc! {
            "$or": [
                { field: Self::uuid_to_binary(uuid) },
                { field: uuid.to_string() },
            ]
        }
    }

    pub async fn create(&self, message: &DirectMessageItem) -> mongodb::error::Result<()> {
        self.collection().insert_one(message).await?;
        Ok(())
    }

    pub async fn find_by_id(
        &self,
        message_id: Uuid,
    ) -> mongodb::error::Result<Option<DirectMessageItem>> {
        self.collection()
            .find_one(Self::uuid_filter("message_id", message_id))
            .await
    }

    pub async fn list_by_dm(
        &self,
        dm_id: Uuid,
        limit: i64,
    ) -> mongodb::error::Result<Vec<DirectMessageItem>> {
        let filter = doc! {
            "$and": [
                Self::uuid_filter("dm_id", dm_id),
                { "deleted_at": null },
            ]
        };

        let options = mongodb::options::FindOptions::builder()
            .sort(doc! { "created_at": -1 })
            .limit(limit)
            .build();

        let cursor = self.collection().find(filter).with_options(options).await?;
        let mut messages: Vec<DirectMessageItem> = cursor.try_collect().await?;
        messages.reverse();
        Ok(messages)
    }

    pub async fn add_reaction(
        &self,
        message_id: Uuid,
        user_id: Uuid,
        emoji: &str,
    ) -> mongodb::error::Result<()> {
        let filter = doc! {
            "$and": [
                Self::uuid_filter("message_id", message_id),
                { "deleted_at": null },
            ]
        };

        self.collection()
            .update_one(
                filter.clone(),
                doc! {
                    "$pull": {
                        "reactions": {
                            "user_id": Self::uuid_to_binary(user_id),
                        }
                    }
                },
            )
            .await?;

        self.collection()
            .update_one(
                filter,
                doc! {
                    "$push": {
                        "reactions": {
                            "user_id": Self::uuid_to_binary(user_id),
                            "emoji": emoji,
                            "created_at": bson::DateTime::now(),
                        }
                    }
                },
            )
            .await?;

        Ok(())
    }

    pub async fn remove_reaction(
        &self,
        message_id: Uuid,
        user_id: Uuid,
        emoji: &str,
    ) -> mongodb::error::Result<()> {
        self.collection()
            .update_one(
                doc! {
                    "$and": [
                        Self::uuid_filter("message_id", message_id),
                        { "deleted_at": null },
                    ]
                },
                doc! {
                    "$pull": {
                        "reactions": {
                            "user_id": Self::uuid_to_binary(user_id),
                            "emoji": emoji,
                        }
                    }
                },
            )
            .await?;

        Ok(())
    }

    pub async fn update_content(
        &self,
        message_id: Uuid,
        content: &str,
    ) -> mongodb::error::Result<()> {
        self.collection()
            .update_one(
                doc! {
                    "$and": [
                        Self::uuid_filter("message_id", message_id),
                        { "deleted_at": null },
                    ]
                },
                doc! {
                    "$set": {
                        "content": content,
                        "edited_at": Utc::now(),
                    }
                },
            )
            .await?;

        Ok(())
    }

    pub async fn soft_delete(&self, message_id: Uuid) -> mongodb::error::Result<()> {
        self.collection()
            .update_one(
                doc! {
                    "$and": [
                        Self::uuid_filter("message_id", message_id),
                        { "deleted_at": null },
                    ]
                },
                doc! {
                    "$set": {
                        "deleted_at": Utc::now(),
                    }
                },
            )
            .await?;

        Ok(())
    }
}
