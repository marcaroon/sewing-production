-- DropForeignKey
ALTER TABLE `sessions` DROP FOREIGN KEY `sessions_userId_fkey`;

-- AlterTable
ALTER TABLE `sessions` MODIFY `expiresAt` DATETIME(3) NOT NULL,
    MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `users` ALTER COLUMN `password` DROP DEFAULT,
    MODIFY `lastLogin` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `sessions_token_idx` ON `sessions`(`token`);

-- CreateIndex
CREATE INDEX `users_email_idx` ON `users`(`email`);

-- CreateIndex
CREATE INDEX `users_isActive_idx` ON `users`(`isActive`);
