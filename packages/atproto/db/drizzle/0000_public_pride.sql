CREATE TABLE "app" (
	"k" text PRIMARY KEY NOT NULL,
	"v" jsonb
);
--> statement-breakpoint
CREATE TABLE "follow" (
	"followed_by" text NOT NULL,
	"follows" text NOT NULL,
	CONSTRAINT "follow_follows_followed_by_pk" PRIMARY KEY("follows","followed_by")
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"created" text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	"modified" text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_tag" (
	"tag_id" text NOT NULL,
	"post_id" text NOT NULL,
	"probability" real,
	CONSTRAINT "post_tag_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "post_queue" (
	"post_id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"value" jsonb
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"did" text PRIMARY KEY NOT NULL,
	"modified" text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "follow" ADD CONSTRAINT "follow_followed_by_user_did_fk" FOREIGN KEY ("followed_by") REFERENCES "public"."user"("did") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tag" ADD CONSTRAINT "post_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tag" ADD CONSTRAINT "post_tag_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "followedby_idx" ON "follow" USING btree ("followed_by");--> statement-breakpoint
CREATE INDEX "post_idx" ON "post_queue" USING btree ("post_id");