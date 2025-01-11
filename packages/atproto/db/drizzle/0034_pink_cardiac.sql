CREATE TABLE "post_reposts" (
	"repost_uri" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"author_id" text,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_repost" UNIQUE("post_id","repost_uri")
);
--> statement-breakpoint
ALTER TABLE "post_reposts" ADD CONSTRAINT "post_reposts_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_repost_postid" ON "post_reposts" USING btree ("post_id");--> statement-breakpoint
ALTER TABLE "post" DROP COLUMN "collection";