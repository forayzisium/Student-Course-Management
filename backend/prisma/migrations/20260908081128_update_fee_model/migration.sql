/*
  Warnings:

  - You are about to drop the column `description` on the `fees` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `fees` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `fees` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `VarChar(191)`.
  - Added the required column `feeType` to the `fees` table without a default value. This is not possible if the table is not empty.
  - Made the column `studentId` on table `fees` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `fees` DROP FOREIGN KEY `fees_studentId_fkey`;

-- AlterTable
ALTER TABLE `fees` DROP COLUMN `description`,
    DROP COLUMN `name`,
    ADD COLUMN `feeType` VARCHAR(191) NOT NULL,
    MODIFY `studentId` INTEGER NOT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'UNPAID';

-- AddForeignKey
ALTER TABLE `fees` ADD CONSTRAINT `fees_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
