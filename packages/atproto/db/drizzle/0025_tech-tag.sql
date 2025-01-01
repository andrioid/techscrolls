-- Custom SQL migration file, put your code below! --
-- Custom SQL migration file, put your code below! --
INSERT INTO "tag" (id) VALUES ('tech') ON CONFLICT DO NOTHING;
