CREATE TABLE `flags` (
	`userId` varchar(255) NOT NULL,
	`postId` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flags_userId_postId_pk` PRIMARY KEY(`userId`,`postId`)
);
--> statement-breakpoint
DROP TABLE `flag`;--> statement-breakpoint
ALTER TABLE `flags` ADD CONSTRAINT `flags_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flags` ADD CONSTRAINT `flags_postId_post_id_fk` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE cascade ON UPDATE no action;