CREATE TABLE `semesters` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `startDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3) NOT NULL,
  `isCurrent` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `semesters_name_key`(`name`),
  INDEX `semesters_isCurrent_idx`(`isCurrent`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Preserve every existing label. Dates are conservative placeholders and can be
-- corrected from Semester Management after deployment.
INSERT INTO `semesters` (`name`, `startDate`, `endDate`, `isCurrent`, `createdAt`, `updatedAt`)
SELECT DISTINCT
  COALESCE(NULLIF(TRIM(`semester`), ''), 'Default Semester'),
  DATE_SUB(CURDATE(), INTERVAL 4 MONTH),
  DATE_ADD(CURDATE(), INTERVAL 2 MONTH),
  false,
  NOW(3),
  NOW(3)
FROM `courses`;

INSERT INTO `semesters` (`name`, `startDate`, `endDate`, `isCurrent`, `createdAt`, `updatedAt`)
SELECT 'Default Semester', DATE_SUB(CURDATE(), INTERVAL 4 MONTH), DATE_ADD(CURDATE(), INTERVAL 2 MONTH), true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `semesters`);

UPDATE `semesters`
SET `isCurrent` = true
WHERE `id` = (SELECT `selected`.`id` FROM (SELECT `id` FROM `semesters` ORDER BY `id` DESC LIMIT 1) AS `selected`);

ALTER TABLE `courses` ADD COLUMN `semesterId` INTEGER NULL;

UPDATE `courses` c
JOIN `semesters` s ON s.`name` = COALESCE(NULLIF(TRIM(c.`semester`), ''), 'Default Semester')
SET c.`semesterId` = s.`id`;

ALTER TABLE `courses` MODIFY `semesterId` INTEGER NOT NULL;
CREATE INDEX `courses_semesterId_fkey` ON `courses`(`semesterId`);
ALTER TABLE `courses` ADD CONSTRAINT `courses_semesterId_fkey`
  FOREIGN KEY (`semesterId`) REFERENCES `semesters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Phase 2, after all external clients stop reading Course.semester:
-- ALTER TABLE `courses` DROP COLUMN `semester`;
