CREATE TABLE "external" (
	"url" text PRIMARY KEY NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"last_crawled" timestamp with time zone,
	"markdown" text DEFAULT '' NOT NULL
);
