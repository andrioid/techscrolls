CREATE TABLE "post_ranking" (
	"post_id" text NOT NULL,
	"tag_id" text,
	"score" integer NOT NULL,
	"algo" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post_ranking" ADD CONSTRAINT "post_ranking_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_ranking" ADD CONSTRAINT "post_ranking_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE no action ON UPDATE no action;