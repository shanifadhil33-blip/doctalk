ALTER TABLE "chunks" ADD COLUMN "page" integer;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "status" text DEFAULT 'ready' NOT NULL;--> statement-breakpoint
CREATE INDEX "chunks_document_id_idx" ON "chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "documents_user_id_idx" ON "documents" USING btree ("user_id");