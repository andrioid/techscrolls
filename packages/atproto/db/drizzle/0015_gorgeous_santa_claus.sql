ALTER TABLE "post" ALTER COLUMN "created" SET DATA TYPE timestamp using created::timestamp;
ALTER TABLE "post" ALTER COLUMN "created" SET DEFAULT now();
ALTER TABLE "post" ALTER COLUMN "modified" SET DATA TYPE timestamp using created::timestamp;
ALTER TABLE "post" ALTER COLUMN "modified" SET DEFAULT now();