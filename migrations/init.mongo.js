// Canonical MongoDB bootstrap indexes for local/CI environments.
// Keep this file aligned with the collections queried by the backend.

db.channel_messages.createIndex(
  { "channel_id": 1, "created_at": -1 },
  { name: "idx_channel_messages_channel_created" }
);

// Optimisation queries "non supprimés" + pagination
db.channel_messages.createIndex(
  { "channel_id": 1, "deleted_at": 1, "created_at": -1 },
  { name: "idx_channel_messages_channel_deleted_created" }
);

db.channel_messages.createIndex(
  { "message_id": 1 },
  { name: "idx_channel_messages_message_id", unique: true }
);

db.channel_messages.createIndex(
  { "server_id": 1 },
  { name: "idx_channel_messages_server" }
);

db.channel_messages.createIndex(
  { "author_id": 1 },
  { name: "idx_channel_messages_author" }
);

db.direct_message_items.createIndex(
  { "dm_id": 1, "created_at": -1 },
  { name: "idx_direct_message_items_dm_created" }
);

db.direct_message_items.createIndex(
  { "dm_id": 1, "deleted_at": 1, "created_at": -1 },
  { name: "idx_direct_message_items_dm_deleted_created" }
);

db.direct_message_items.createIndex(
  { "message_id": 1 },
  { name: "idx_direct_message_items_message_id", unique: true }
);

db.direct_message_items.createIndex(
  { "author_id": 1, "created_at": -1 },
  { name: "idx_direct_message_items_author_created" }
);
