ALTER TABLE "follow" RENAME TO "did_follow";--> statement-breakpoint
ALTER TABLE "user" RENAME TO "did";--> statement-breakpoint
ALTER TABLE "did_follow" DROP CONSTRAINT "follow_followed_by_user_did_fk";
--> statement-breakpoint
ALTER TABLE "did_follow" DROP CONSTRAINT "follow_follows_followed_by_pk";--> statement-breakpoint
ALTER TABLE "did_follow" ADD CONSTRAINT "did_follow_follows_followed_by_pk" PRIMARY KEY("follows","followed_by");--> statement-breakpoint
ALTER TABLE "did" ADD COLUMN "added_by" text DEFAULT 'feed' NOT NULL;--> statement-breakpoint
ALTER TABLE "did_follow" ADD CONSTRAINT "did_follow_followed_by_did_did_fk" FOREIGN KEY ("followed_by") REFERENCES "public"."did"("did") ON DELETE no action ON UPDATE no action;