-- CreateTable
CREATE TABLE `fees` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `feeType` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `status` ENUM('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'UNPAID',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fees_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `fees` ADD CONSTRAINT `fees_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
