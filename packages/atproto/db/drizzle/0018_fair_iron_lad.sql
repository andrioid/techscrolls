ALTER TABLE "post_tag" DROP CONSTRAINT "post_tag_post_id_post_id_fk";
--> statement-breakpoint
ALTER TABLE "post_tag" ADD CONSTRAINT "post_tag_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;