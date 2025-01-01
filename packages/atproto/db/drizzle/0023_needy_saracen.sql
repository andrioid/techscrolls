CREATE TABLE "post_ranking" (
	"post_id" text NOT NULL,
	"tag_id" text,
	"score" integer NOT NULL,
	"algo" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_record" (
	"post_id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"cid" text NOT NULL,
	"value" jsonb
);
--> statement-breakpoint
CREATE TABLE "post_tag" (
	"tag_id" text NOT NULL,
	"post_id" text NOT NULL,
	"score" integer NOT NULL,
	"algo" text NOT NULL,
	CONSTRAINT "post_tag_algo_post_id_tag_id_unique" UNIQUE("algo","post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "post_texts" (
	"post_id" text,
	"text" text,
	"source" text
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"modified" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "follow" (
	"followed_by" text NOT NULL,
	"follows" text NOT NULL,
	CONSTRAINT "follow_follows_followed_by_pk" PRIMARY KEY("follows","followed_by")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"did" text PRIMARY KEY NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"modified" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post_ranking" ADD CONSTRAINT "post_ranking_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_ranking" ADD CONSTRAINT "post_ranking_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_record" ADD CONSTRAINT "post_record_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tag" ADD CONSTRAINT "post_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tag" ADD CONSTRAINT "post_tag_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_texts" ADD CONSTRAINT "post_texts_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow" ADD CONSTRAINT "follow_followed_by_user_did_fk" FOREIGN KEY ("followed_by") REFERENCES "public"."user"("did") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_idx" ON "post_record" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "tagpost_idx" ON "post_tag" USING btree ("post_id","tag_id");--> statement-breakpoint
CREATE INDEX "idx_postid" ON "post_texts" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_created" ON "post" USING btree ("created");--> statement-breakpoint
CREATE INDEX "followedby_idx" ON "follow" USING btree ("followed_by");--> statement-breakpoint
CREATE VIEW "public"."posts_tag_avg" AS (select "post_id", "tag_id", round(avg("score"), 0) as "avg_score", ARRAY_AGG(DISTINCT "algo") as "algos" from "post_tag" group by "post_tag"."post_id", "post_tag"."tag_id");