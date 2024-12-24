ALTER TABLE "post_tag" ALTER COLUMN "probability" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "post_tag" ALTER COLUMN "probability" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "post_tag" ADD COLUMN "algo" text NOT NULL;