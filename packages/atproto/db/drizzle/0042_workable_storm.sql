DELETE FROM "post_texts" WHERE "post_id" IS NULL;
ALTER TABLE "post_texts" ALTER COLUMN "post_id" SET NOT NULL;