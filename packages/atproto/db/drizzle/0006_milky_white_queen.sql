PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_post_data` (
	`post_id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`value` text,
	FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_post_data`("post_id", "type", "value") SELECT "post_id", "type", "value" FROM `post_data`;--> statement-breakpoint
DROP TABLE `post_data`;--> statement-breakpoint
ALTER TABLE `__new_post_data` RENAME TO `post_data`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `post_idx` ON `post_data` (`post_id`);