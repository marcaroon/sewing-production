-- 1. Tambah kolom baru DENGAN DEFAULT
ALTER TABLE `users`
ADD COLUMN `password` VARCHAR(191) NOT NULL DEFAULT '$2b$10$temp_password_hash',
ADD COLUMN `emailVerified` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN `lastLogin` DATETIME NULL,
ADD COLUMN `phone` VARCHAR(191) NULL,
ADD COLUMN `avatar` VARCHAR(191) NULL;

-- 2. Isi email yang NULL (WAJIB sebelum NOT NULL)
UPDATE `users`
SET `email` = CONCAT('user_', id, '@example.com')
WHERE `email` IS NULL;

-- 3. Baru enforce email NOT NULL
ALTER TABLE `users`
MODIFY `email` VARCHAR(191) NOT NULL;

-- 4. Create sessions table
CREATE TABLE `sessions` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `ipAddress` VARCHAR(191) NULL,
  `userAgent` VARCHAR(191) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE INDEX `sessions_token_key` (`token`),
  INDEX `sessions_userId_idx` (`userId`),
  INDEX `sessions_expiresAt_idx` (`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. FK session → user
ALTER TABLE `sessions`
ADD CONSTRAINT `sessions_userId_fkey`
FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
