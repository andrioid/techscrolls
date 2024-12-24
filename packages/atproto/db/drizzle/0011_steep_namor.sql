CREATE VIEW "public"."posts_tag_avg" AS (select "post_id", "tag_id", round(avg("score"), 0) as "avg_score" from "post_tag" group by "post_tag"."post_id", "post_tag"."tag_id");