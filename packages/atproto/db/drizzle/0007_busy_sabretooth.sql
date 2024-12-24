ALTER TABLE "post_records" RENAME TO "post_record";--> statement-breakpoint
ALTER TABLE "post_record" DROP CONSTRAINT "post_records_post_id_post_id_fk";
--> statement-breakpoint
ALTER TABLE "post_record" ADD CONSTRAINT "post_record_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE no action ON UPDATE no action;