/*
  Warnings:

  - You are about to drop the column `feeType` on the `fees` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `fees` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `Enum(EnumId(9))`.
  - Added the required column `description` to the `fees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `fees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `fees` DROP COLUMN `feeType`,
    ADD COLUMN `description` TEXT NOT NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    MODIFY `studentId` INTEGER NULL,
    MODIFY `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE';
