use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::de::Error as _;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::models::message::{MessageReaction, MessageReactionPublic};

mod uuid_compat_binary_generic {
    use super::*;
    use bson::Binary;
    use serde::{Deserializer, Serializer};

    #[derive(Deserialize)]
    #[serde(untagged)]
    enum UuidCompat {
        Str(String),
        BsonUuid(bson::Uuid),
        Binary(Binary),
    }

    pub fn serialize<S>(value: &Uuid, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let b = Binary {
            subtype: bson::spec::BinarySubtype::Generic,
            bytes: value.as_bytes().to_vec(),
        };
        b.serialize(serializer)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Uuid, D::Error>
    where
        D: Deserializer<'de>,
    {
        let v = UuidCompat::deserialize(deserializer)?;
        match v {
            UuidCompat::Str(s) => Uuid::parse_str(&s).map_err(D::Error::custom),
            UuidCompat::BsonUuid(u) => Ok(u.into()),
            UuidCompat::Binary(b) => Uuid::from_slice(&b.bytes).map_err(D::Error::custom),
        }
    }
}

mod datetime_compat {
    use super::*;
    use serde::{Deserializer, Serializer};

    #[derive(Deserialize)]
    #[serde(untagged)]
    enum DateTimeCompat {
        Rfc3339(String),
        Bson(bson::DateTime),
    }

    pub fn serialize<S>(value: &DateTime<Utc>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        bson::DateTime::from_chrono(*value).serialize(serializer)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<DateTime<Utc>, D::Error>
    where
        D: Deserializer<'de>,
    {
        match DateTimeCompat::deserialize(deserializer)? {
            DateTimeCompat::Rfc3339(value) => DateTime::parse_from_rfc3339(&value)
                .map(|dt| dt.with_timezone(&Utc))
                .map_err(D::Error::custom),
            DateTimeCompat::Bson(value) => Ok(value.to_chrono()),
        }
    }

    pub mod option {
        use super::*;

        pub fn serialize<S>(value: &Option<DateTime<Utc>>, serializer: S) -> Result<S::Ok, S::Error>
        where
            S: Serializer,
        {
            match value {
                Some(v) => serializer.serialize_some(&bson::DateTime::from_chrono(*v)),
                None => serializer.serialize_none(),
            }
        }

        pub fn deserialize<'de, D>(deserializer: D) -> Result<Option<DateTime<Utc>>, D::Error>
        where
            D: Deserializer<'de>,
        {
            match Option::<DateTimeCompat>::deserialize(deserializer)? {
                Some(DateTimeCompat::Rfc3339(value)) => DateTime::parse_from_rfc3339(&value)
                    .map(|dt| Some(dt.with_timezone(&Utc)))
                    .map_err(D::Error::custom),
                Some(DateTimeCompat::Bson(value)) => Ok(Some(value.to_chrono())),
                None => Ok(None),
            }
        }
    }
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct DirectMessage {
    pub id: Uuid,
    pub user1_id: Uuid,
    pub user2_id: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct DMWithRecipient {
    pub id: Uuid,
    pub recipient_id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDMPayload {
    pub target_username: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateDMMessagePayload {
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectMessageItem {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(with = "uuid_compat_binary_generic")]
    pub message_id: Uuid,
    #[serde(with = "uuid_compat_binary_generic")]
    pub dm_id: Uuid,
    #[serde(with = "uuid_compat_binary_generic")]
    pub author_id: Uuid,
    pub content: String,
    #[serde(with = "datetime_compat")]
    pub created_at: DateTime<Utc>,
    #[serde(default)]
    #[serde(with = "datetime_compat::option")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub edited_at: Option<DateTime<Utc>>,
    #[serde(default)]
    #[serde(with = "datetime_compat::option")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<DateTime<Utc>>,
    #[serde(default)]
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub reactions: Vec<MessageReaction>,
}

#[derive(Debug, Serialize)]
pub struct DirectMessageItemResponse {
    pub id: Uuid,
    pub dm_id: Uuid,
    pub author_id: Uuid,
    pub username: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub edited_at: Option<DateTime<Utc>>,
    #[serde(default)]
    pub reactions: Vec<MessageReactionPublic>,
}
