ALTER TABLE "post_tag" DROP CONSTRAINT "post_tag_post_id_tag_id_pk";--> statement-breakpoint
CREATE INDEX "tagpost_idx" ON "post_tag" USING btree ("post_id","tag_id");