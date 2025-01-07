ALTER TABLE "post" ADD COLUMN "lastMentioned" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_lastmentioned" ON "post" USING btree ("lastMentioned");