-- CreateTable
CREATE TABLE `attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `courseId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL DEFAULT 'PRESENT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `attendance_studentId_courseId_date_key`(`studentId`, `courseId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
