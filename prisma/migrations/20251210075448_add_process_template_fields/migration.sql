/*
  Warnings:

  - Added the required column `processFlow` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `orders` ADD COLUMN `processFlow` VARCHAR(191) NULL,
    ADD COLUMN `processTemplate` VARCHAR(191) NULL,
    ADD COLUMN `totalProcessSteps` INTEGER NOT NULL DEFAULT 0;
