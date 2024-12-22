DROP INDEX `post_data_post_id_unique`;--> statement-breakpoint
ALTER TABLE `post_data` ADD `type` text NOT NULL;--> statement-breakpoint
CREATE INDEX `post_idx` ON `post_data` (`post_id`);--> statement-breakpoint
ALTER TABLE `follow` DROP COLUMN `modified`;