ALTER TABLE "post_reposts" DROP CONSTRAINT "post_reposts_post_id_post_id_fk";
--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "root_uri" text;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "parent_uri" text;--> statement-breakpoint
ALTER TABLE "post_reposts" ADD CONSTRAINT "post_reposts_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;