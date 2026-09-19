ALTER TABLE `semesters`
  ADD COLUMN `costPerCredit` DOUBLE NOT NULL DEFAULT 0;

ALTER TABLE `fees`
  ADD COLUMN `courseId` INTEGER NULL,
  ADD COLUMN `semesterId` INTEGER NULL,
  ADD COLUMN `enrollmentId` INTEGER NULL;

CREATE UNIQUE INDEX `fees_enrollmentId_key` ON `fees`(`enrollmentId`);
CREATE INDEX `fees_courseId_idx` ON `fees`(`courseId`);
CREATE INDEX `fees_semesterId_idx` ON `fees`(`semesterId`);

ALTER TABLE `fees`
  ADD CONSTRAINT `fees_courseId_fkey`
    FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fees_semesterId_fkey`
    FOREIGN KEY (`semesterId`) REFERENCES `semesters`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fees_enrollmentId_fkey`
    FOREIGN KEY (`enrollmentId`) REFERENCES `enrollments`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Link any existing fee whose label begins with a unique course code. Existing
-- hand-entered fees remain valid and nullable; new enrollment fees are linked
-- automatically by the application.
UPDATE `fees` f
JOIN `courses` c ON f.`feeType` LIKE CONCAT(c.`code`, ' %')
SET f.`courseId` = c.`id`, f.`semesterId` = c.`semesterId`
WHERE f.`courseId` IS NULL;
