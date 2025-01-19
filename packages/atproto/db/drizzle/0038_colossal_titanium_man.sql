CREATE TABLE "post_externals" (
	"url" text,
	"post_id" text,
	CONSTRAINT "post_externals_post_id_url_pk" PRIMARY KEY("post_id","url")
);
--> statement-breakpoint
ALTER TABLE "post_externals" ADD CONSTRAINT "post_externals_url_external_url_fk" FOREIGN KEY ("url") REFERENCES "public"."external"("url") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_externals" ADD CONSTRAINT "post_externals_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE no action ON UPDATE no action;