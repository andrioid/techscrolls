CREATE TABLE `follow` (
	`followed_by` text NOT NULL,
	`follows` text NOT NULL,
	`modified` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	PRIMARY KEY(`follows`, `followed_by`),
	FOREIGN KEY (`followed_by`) REFERENCES `user`(`did`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`follows`) REFERENCES `user`(`did`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `post_data` (
	`post_id` text,
	FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_data_post_id_unique` ON `post_data` (`post_id`);--> statement-breakpoint
CREATE TABLE `post` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text,
	`created` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`modified` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`did`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `post_tag` (
	`tag_id` text NOT NULL,
	`post_id` text NOT NULL,
	`probability` real,
	PRIMARY KEY(`post_id`, `tag_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `user` (
	`did` text PRIMARY KEY NOT NULL,
	`modified` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
