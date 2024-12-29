ALTER TABLE "user" ALTER COLUMN "modified" SET DATA TYPE timestamp with time zone using modified::timestamp;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "modified" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created" timestamp with time zone DEFAULT now() NOT NULL;