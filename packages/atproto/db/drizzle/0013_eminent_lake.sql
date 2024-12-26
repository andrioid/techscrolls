CREATE TABLE "tfjs_model" (
	"name" text PRIMARY KEY NOT NULL,
	"modelJSON" jsonb NOT NULL,
	"weights" "bytea" NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP)
);
