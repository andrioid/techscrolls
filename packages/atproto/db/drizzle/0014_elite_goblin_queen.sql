ALTER TABLE "tfjs_model" RENAME COLUMN "modelJSON" TO "model_json";--> statement-breakpoint
ALTER TABLE "tfjs_model" ADD COLUMN "unique_words" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tfjs_model" ADD COLUMN "word_index" jsonb NOT NULL;