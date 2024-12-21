PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_follow` (
	`followed_by` text NOT NULL,
	`follows` text NOT NULL,
	PRIMARY KEY(`follows`, `followed_by`),
	FOREIGN KEY (`followed_by`) REFERENCES `user`(`did`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_follow`("followed_by", "follows") SELECT "followed_by", "follows" FROM `follow`;--> statement-breakpoint
DROP TABLE `follow`;--> statement-breakpoint
ALTER TABLE `__new_follow` RENAME TO `follow`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `followedby_idx` ON `follow` (`followed_by`);