ALTER TABLE "post_tag" ADD CONSTRAINT "post_tag_algo_post_id_tag_id_unique" UNIQUE("algo","post_id","tag_id");