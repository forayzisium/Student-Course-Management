-- Add an optional persistent profile-image URL without changing existing users.
ALTER TABLE `users`
    ADD COLUMN `profileImage` VARCHAR(2048) NULL;
