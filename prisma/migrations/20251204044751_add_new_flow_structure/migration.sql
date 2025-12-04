/*
  Warnings:

  - You are about to drop the column `currentStatus` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `leadTimeCutting` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `leadTimeFinalQc` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `leadTimeIroning` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `leadTimeNumbering` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `leadTimePacking` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `leadTimeQc` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `leadTimeSewing` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `leadTimeShiwake` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `progressCutting` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `progressFinalQc` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `progressIroning` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `progressNumbering` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `progressPacking` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `progressQc` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `progressSewing` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `progressShiwake` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `targetDate` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `wipAtCutting` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `wipAtIroning` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `wipAtNumbering` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `wipAtPacking` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `wipAtQC` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `wipAtSewing` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `wipAtShiwake` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `reject_logs` table. All the data in the column will be lost.
  - You are about to drop the column `processStatus` on the `reject_logs` table. All the data in the column will be lost.
  - You are about to drop the `process_histories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transfer_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transfer_logs` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `deliveryDeadline` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productionDeadline` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `processName` to the `reject_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `processPhase` to the `reject_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `processStepId` to the `reject_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rejectCategory` to the `reject_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `process_histories` DROP FOREIGN KEY `process_histories_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `process_histories` DROP FOREIGN KEY `process_histories_transferLogId_fkey`;

-- DropForeignKey
ALTER TABLE `transfer_items` DROP FOREIGN KEY `transfer_items_transferLogId_fkey`;

-- DropForeignKey
ALTER TABLE `transfer_logs` DROP FOREIGN KEY `transfer_logs_orderId_fkey`;

-- DropIndex
DROP INDEX `orders_currentStatus_idx` ON `orders`;

-- DropIndex
DROP INDEX `orders_targetDate_idx` ON `orders`;

-- DropIndex
DROP INDEX `reject_logs_date_idx` ON `reject_logs`;

-- AlterTable
ALTER TABLE `orders` DROP COLUMN `currentStatus`,
    DROP COLUMN `leadTimeCutting`,
    DROP COLUMN `leadTimeFinalQc`,
    DROP COLUMN `leadTimeIroning`,
    DROP COLUMN `leadTimeNumbering`,
    DROP COLUMN `leadTimePacking`,
    DROP COLUMN `leadTimeQc`,
    DROP COLUMN `leadTimeSewing`,
    DROP COLUMN `leadTimeShiwake`,
    DROP COLUMN `progressCutting`,
    DROP COLUMN `progressFinalQc`,
    DROP COLUMN `progressIroning`,
    DROP COLUMN `progressNumbering`,
    DROP COLUMN `progressPacking`,
    DROP COLUMN `progressQc`,
    DROP COLUMN `progressSewing`,
    DROP COLUMN `progressShiwake`,
    DROP COLUMN `targetDate`,
    DROP COLUMN `wipAtCutting`,
    DROP COLUMN `wipAtIroning`,
    DROP COLUMN `wipAtNumbering`,
    DROP COLUMN `wipAtPacking`,
    DROP COLUMN `wipAtQC`,
    DROP COLUMN `wipAtSewing`,
    DROP COLUMN `wipAtShiwake`,
    ADD COLUMN `assignedTo` VARCHAR(191) NULL,
    ADD COLUMN `currentPhase` VARCHAR(191) NOT NULL DEFAULT 'production',
    ADD COLUMN `currentProcess` VARCHAR(191) NOT NULL DEFAULT 'draft',
    ADD COLUMN `currentState` VARCHAR(191) NOT NULL DEFAULT 'at_ppic',
    ADD COLUMN `deliveryDeadline` DATETIME(3) NOT NULL,
    ADD COLUMN `productionDeadline` DATETIME(3) NOT NULL,
    ADD COLUMN `totalCompleted` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `reject_logs` DROP COLUMN `date`,
    DROP COLUMN `processStatus`,
    ADD COLUMN `actionTakenBy` VARCHAR(191) NULL,
    ADD COLUMN `actionTakenTime` DATETIME(3) NULL,
    ADD COLUMN `bundleNumber` VARCHAR(191) NULL,
    ADD COLUMN `detectedTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `finalDisposition` VARCHAR(191) NULL,
    ADD COLUMN `processName` VARCHAR(191) NOT NULL,
    ADD COLUMN `processPhase` VARCHAR(191) NOT NULL,
    ADD COLUMN `processStepId` VARCHAR(191) NOT NULL,
    ADD COLUMN `rejectCategory` VARCHAR(191) NOT NULL,
    ADD COLUMN `reworkCompleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `reworkCompletedTime` DATETIME(3) NULL,
    ADD COLUMN `rootCause` TEXT NULL;

-- DropTable
DROP TABLE `process_histories`;

-- DropTable
DROP TABLE `transfer_items`;

-- DropTable
DROP TABLE `transfer_logs`;

-- CreateTable
CREATE TABLE `process_steps` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `processName` VARCHAR(191) NOT NULL,
    `processPhase` VARCHAR(191) NOT NULL,
    `sequenceOrder` INTEGER NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `assignedTo` VARCHAR(191) NULL,
    `assignedLine` VARCHAR(191) NULL,
    `arrivedAtPpicTime` DATETIME(3) NULL,
    `addedToWaitingTime` DATETIME(3) NULL,
    `assignedTime` DATETIME(3) NULL,
    `startedTime` DATETIME(3) NULL,
    `completedTime` DATETIME(3) NULL,
    `quantityReceived` INTEGER NOT NULL DEFAULT 0,
    `quantityCompleted` INTEGER NOT NULL DEFAULT 0,
    `quantityRejected` INTEGER NOT NULL DEFAULT 0,
    `quantityRework` INTEGER NOT NULL DEFAULT 0,
    `waitingDuration` INTEGER NULL,
    `processingDuration` INTEGER NULL,
    `totalDuration` INTEGER NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `process_steps_orderId_idx`(`orderId`),
    INDEX `process_steps_processName_idx`(`processName`),
    INDEX `process_steps_processPhase_idx`(`processPhase`),
    INDEX `process_steps_status_idx`(`status`),
    INDEX `process_steps_sequenceOrder_idx`(`sequenceOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `process_transitions` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `processStepId` VARCHAR(191) NOT NULL,
    `fromState` VARCHAR(191) NOT NULL,
    `toState` VARCHAR(191) NOT NULL,
    `transitionTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `performedBy` VARCHAR(191) NOT NULL,
    `processName` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `process_transitions_orderId_idx`(`orderId`),
    INDEX `process_transitions_processStepId_idx`(`processStepId`),
    INDEX `process_transitions_transitionTime_idx`(`transitionTime`),
    INDEX `process_transitions_fromState_idx`(`fromState`),
    INDEX `process_transitions_toState_idx`(`toState`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `orders_currentPhase_idx` ON `orders`(`currentPhase`);

-- CreateIndex
CREATE INDEX `orders_currentProcess_idx` ON `orders`(`currentProcess`);

-- CreateIndex
CREATE INDEX `orders_currentState_idx` ON `orders`(`currentState`);

-- CreateIndex
CREATE INDEX `orders_productionDeadline_idx` ON `orders`(`productionDeadline`);

-- CreateIndex
CREATE INDEX `orders_deliveryDeadline_idx` ON `orders`(`deliveryDeadline`);

-- CreateIndex
CREATE INDEX `reject_logs_processStepId_idx` ON `reject_logs`(`processStepId`);

-- CreateIndex
CREATE INDEX `reject_logs_detectedTime_idx` ON `reject_logs`(`detectedTime`);

-- CreateIndex
CREATE INDEX `reject_logs_rejectCategory_idx` ON `reject_logs`(`rejectCategory`);

-- AddForeignKey
ALTER TABLE `process_steps` ADD CONSTRAINT `process_steps_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `process_transitions` ADD CONSTRAINT `process_transitions_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `process_transitions` ADD CONSTRAINT `process_transitions_processStepId_fkey` FOREIGN KEY (`processStepId`) REFERENCES `process_steps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reject_logs` ADD CONSTRAINT `reject_logs_processStepId_fkey` FOREIGN KEY (`processStepId`) REFERENCES `process_steps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
