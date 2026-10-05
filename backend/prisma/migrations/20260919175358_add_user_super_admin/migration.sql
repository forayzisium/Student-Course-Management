/*
  Warnings:

  - You are about to alter the column `status` on the `fees` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(9))`.
  - A unique constraint covering the columns `[transactionId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `assignments` ADD COLUMN `maxMarks` DOUBLE NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE `courses` ADD COLUMN `credits` DOUBLE NOT NULL DEFAULT 3.0,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `syllabus` TEXT NULL,
    ADD COLUMN `teacherProfileId` INTEGER NULL;

-- AlterTable
ALTER TABLE `fees` MODIFY `status` ENUM('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE `payments` ADD COLUMN `channel` VARCHAR(255) NULL,
    ADD COLUMN `feeId` INTEGER NULL,
    ADD COLUMN `transactionId` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `student_profiles` ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `aiMessagesUsed` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `aiPlan` VARCHAR(191) NOT NULL DEFAULT 'FREE',
    ADD COLUMN `aiUsageResetAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `assignmentNotifications` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `feeNotifications` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `gradeNotifications` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `phone` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `teacher_profiles` ADD COLUMN `phone` VARCHAR(32) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `isSuperAdmin` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sessionVersion` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `admin_invitations` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `invitedBy` INTEGER NOT NULL,
    `targetUserId` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `acceptedAt` DATETIME(3) NULL,

    UNIQUE INDEX `admin_invitations_tokenHash_key`(`tokenHash`),
    INDEX `admin_invitations_email_status_idx`(`email`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_access_audit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actorId` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `attendance_studentId_fkey` ON `attendance`(`studentId`);

-- CreateIndex
CREATE INDEX `courses_teacherProfileId_fkey` ON `courses`(`teacherProfileId`);

-- CreateIndex
CREATE INDEX `grades_studentId_fkey` ON `grades`(`studentId`);

-- CreateIndex
CREATE UNIQUE INDEX `transactionId` ON `payments`(`transactionId`);

-- CreateIndex
CREATE INDEX `payments_feeId_idx` ON `payments`(`feeId`);

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `teacher_profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_feeId_fkey` FOREIGN KEY (`feeId`) REFERENCES `fees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
