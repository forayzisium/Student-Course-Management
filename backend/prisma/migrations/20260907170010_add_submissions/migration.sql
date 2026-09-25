-- CreateTable
CREATE TABLE `submissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assignmentId` INTEGER NOT NULL,
    `studentId` INTEGER NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('SUBMITTED', 'GRADED') NOT NULL DEFAULT 'SUBMITTED',
    `marks` DOUBLE NULL,
    `feedback` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `submissions_assignmentId_idx`(`assignmentId`),
    INDEX `submissions_studentId_idx`(`studentId`),
    UNIQUE INDEX `submissions_assignmentId_studentId_key`(`assignmentId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
