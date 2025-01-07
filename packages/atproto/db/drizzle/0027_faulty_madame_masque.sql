ALTER TABLE "post" ADD COLUMN "collection" text DEFAULT 'app.bsky.feed.post' NOT NULL;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "content_flags" integer;