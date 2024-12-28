ALTER TABLE "post_record" DROP CONSTRAINT "post_record_post_id_post_id_fk";
--> statement-breakpoint
ALTER TABLE "post_record" ADD CONSTRAINT "post_record_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;