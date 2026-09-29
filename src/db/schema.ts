import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id"),
    fileName: text("file_name").notNull(),
    fileUrl: text("file_url").notNull(),
    isDemo: boolean("is_demo").default(false).notNull(),
    /** processing, ready, or failed. Default ready so existing rows stay readable. */
    status: text("status").default("ready").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("documents_user_id_idx").on(table.userId)],
);

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
    chunkIndex: integer("chunk_index").notNull(),
    /** 1-based PDF page. Nullable so rows created before this column still load. */
    page: integer("page"),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("chunks_document_id_idx").on(table.documentId),
    index("chunks_embedding_hnsw_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);

export const extractions = pgTable("extractions", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  extractedJson: jsonb("extracted_json"),
  sourceMap: jsonb("source_map"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
