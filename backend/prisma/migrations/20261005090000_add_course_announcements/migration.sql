-- Add course-scoped teacher announcements without modifying existing data.
CREATE TABLE `course_announcements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `teacherId` INTEGER NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('GENERAL', 'CLASS_CANCELLED', 'CLASS_RESCHEDULED', 'ROOM_CHANGE', 'REMINDER') NOT NULL DEFAULT 'GENERAL',
    `rescheduledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `course_announcements_courseId_createdAt_idx`(`courseId`, `createdAt`),
    INDEX `course_announcements_teacherId_createdAt_idx`(`teacherId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `course_announcements`
    ADD CONSTRAINT `course_announcements_courseId_fkey`
    FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `course_announcements`
    ADD CONSTRAINT `course_announcements_teacherId_fkey`
    FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
