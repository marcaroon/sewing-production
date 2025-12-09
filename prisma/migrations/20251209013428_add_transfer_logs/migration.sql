-- CreateTable
CREATE TABLE `buyers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `contactPerson` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `canReuse` BOOLEAN NOT NULL DEFAULT false,
    `returRequired` BOOLEAN NOT NULL DEFAULT false,
    `storageLocation` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `buyers_code_key`(`code`),
    INDEX `buyers_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `styles` (
    `id` VARCHAR(191) NOT NULL,
    `styleCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `estimatedCuttingTime` INTEGER NULL,
    `estimatedSewingTime` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `styles_styleCode_key`(`styleCode`),
    INDEX `styles_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `buyerId` VARCHAR(191) NOT NULL,
    `styleId` VARCHAR(191) NOT NULL,
    `orderDate` DATETIME(3) NOT NULL,
    `productionDeadline` DATETIME(3) NOT NULL,
    `deliveryDeadline` DATETIME(3) NOT NULL,
    `totalQuantity` INTEGER NOT NULL,
    `currentPhase` VARCHAR(191) NOT NULL DEFAULT 'production',
    `currentProcess` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `currentState` VARCHAR(191) NOT NULL DEFAULT 'at_ppic',
    `assignedLine` VARCHAR(191) NULL,
    `assignedTo` VARCHAR(191) NULL,
    `materialsIssued` BOOLEAN NOT NULL DEFAULT false,
    `totalCompleted` INTEGER NOT NULL DEFAULT 0,
    `totalRejected` INTEGER NOT NULL DEFAULT 0,
    `totalRework` INTEGER NOT NULL DEFAULT 0,
    `hasLeftover` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_orderNumber_key`(`orderNumber`),
    INDEX `orders_buyerId_idx`(`buyerId`),
    INDEX `orders_styleId_idx`(`styleId`),
    INDEX `orders_currentPhase_idx`(`currentPhase`),
    INDEX `orders_currentProcess_idx`(`currentProcess`),
    INDEX `orders_currentState_idx`(`currentState`),
    INDEX `orders_orderDate_idx`(`orderDate`),
    INDEX `orders_productionDeadline_idx`(`productionDeadline`),
    INDEX `orders_deliveryDeadline_idx`(`deliveryDeadline`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transfer_logs` (
    `id` VARCHAR(191) NOT NULL,
    `transferNumber` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `processStepId` VARCHAR(191) NOT NULL,
    `fromProcess` VARCHAR(191) NOT NULL,
    `fromDepartment` VARCHAR(191) NOT NULL,
    `toProcess` VARCHAR(191) NOT NULL,
    `toDepartment` VARCHAR(191) NOT NULL,
    `transferDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `handedOverBy` VARCHAR(191) NOT NULL,
    `receivedBy` VARCHAR(191) NULL,
    `quantityTransferred` INTEGER NOT NULL,
    `quantityCompleted` INTEGER NOT NULL,
    `quantityRejected` INTEGER NOT NULL,
    `quantityRework` INTEGER NOT NULL,
    `rejectSummary` TEXT NULL,
    `processingDuration` INTEGER NULL,
    `waitingDuration` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `isReceived` BOOLEAN NOT NULL DEFAULT false,
    `receivedDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `issues` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `transfer_logs_transferNumber_key`(`transferNumber`),
    INDEX `transfer_logs_orderId_idx`(`orderId`),
    INDEX `transfer_logs_processStepId_idx`(`processStepId`),
    INDEX `transfer_logs_transferDate_idx`(`transferDate`),
    INDEX `transfer_logs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `size_breakdowns` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `size` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `completed` INTEGER NOT NULL DEFAULT 0,
    `rejected` INTEGER NOT NULL DEFAULT 0,
    `bundleCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `size_breakdowns_orderId_idx`(`orderId`),
    INDEX `size_breakdowns_size_idx`(`size`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `reject_logs` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `processStepId` VARCHAR(191) NOT NULL,
    `processName` VARCHAR(191) NOT NULL,
    `processPhase` VARCHAR(191) NOT NULL,
    `detectedTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reportedBy` VARCHAR(191) NOT NULL,
    `rejectType` VARCHAR(191) NOT NULL,
    `rejectCategory` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `size` VARCHAR(191) NULL,
    `bundleNumber` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `rootCause` TEXT NULL,
    `action` VARCHAR(191) NOT NULL,
    `actionTakenBy` VARCHAR(191) NULL,
    `actionTakenTime` DATETIME(3) NULL,
    `reworkCompleted` BOOLEAN NOT NULL DEFAULT false,
    `reworkCompletedTime` DATETIME(3) NULL,
    `finalDisposition` VARCHAR(191) NULL,
    `images` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `reject_logs_orderId_idx`(`orderId`),
    INDEX `reject_logs_processStepId_idx`(`processStepId`),
    INDEX `reject_logs_detectedTime_idx`(`detectedTime`),
    INDEX `reject_logs_rejectCategory_idx`(`rejectCategory`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leftover_materials` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `buyerId` VARCHAR(191) NOT NULL,
    `buyerType` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `storageLocation` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `materials` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `leftover_materials_orderId_idx`(`orderId`),
    INDEX `leftover_materials_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sewing_lines` (
    `id` VARCHAR(191) NOT NULL,
    `lineName` VARCHAR(191) NOT NULL,
    `lineCode` VARCHAR(191) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `currentLoad` INTEGER NOT NULL DEFAULT 0,
    `operators` INTEGER NOT NULL,
    `supervisor` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sewing_lines_lineCode_key`(`lineCode`),
    INDEX `sewing_lines_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bundles` (
    `id` VARCHAR(191) NOT NULL,
    `bundleNumber` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `size` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `currentLocation` VARCHAR(191) NOT NULL,
    `currentStatus` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUpdated` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bundles_bundleNumber_key`(`bundleNumber`),
    INDEX `bundles_orderId_idx`(`orderId`),
    INDEX `bundles_currentStatus_idx`(`currentStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_department_idx`(`department`),
    INDEX `users_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_qr_codes` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `qrCode` VARCHAR(191) NOT NULL,
    `qrData` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `order_qr_codes_orderId_key`(`orderId`),
    UNIQUE INDEX `order_qr_codes_qrCode_key`(`qrCode`),
    INDEX `order_qr_codes_qrCode_idx`(`qrCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bundle_qr_codes` (
    `id` VARCHAR(191) NOT NULL,
    `bundleId` VARCHAR(191) NOT NULL,
    `qrCode` VARCHAR(191) NOT NULL,
    `qrData` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `bundle_qr_codes_bundleId_key`(`bundleId`),
    UNIQUE INDEX `bundle_qr_codes_qrCode_key`(`qrCode`),
    INDEX `bundle_qr_codes_qrCode_idx`(`qrCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qr_scans` (
    `id` VARCHAR(191) NOT NULL,
    `qrCode` VARCHAR(191) NOT NULL,
    `qrType` VARCHAR(191) NOT NULL,
    `orderQRId` VARCHAR(191) NULL,
    `bundleQRId` VARCHAR(191) NULL,
    `scannedBy` VARCHAR(191) NOT NULL,
    `scannedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `location` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `deviceInfo` VARCHAR(191) NULL,

    INDEX `qr_scans_qrCode_idx`(`qrCode`),
    INDEX `qr_scans_scannedAt_idx`(`scannedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `buyers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_styleId_fkey` FOREIGN KEY (`styleId`) REFERENCES `styles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer_logs` ADD CONSTRAINT `transfer_logs_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer_logs` ADD CONSTRAINT `transfer_logs_processStepId_fkey` FOREIGN KEY (`processStepId`) REFERENCES `process_steps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `size_breakdowns` ADD CONSTRAINT `size_breakdowns_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `process_steps` ADD CONSTRAINT `process_steps_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `process_transitions` ADD CONSTRAINT `process_transitions_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `process_transitions` ADD CONSTRAINT `process_transitions_processStepId_fkey` FOREIGN KEY (`processStepId`) REFERENCES `process_steps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reject_logs` ADD CONSTRAINT `reject_logs_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reject_logs` ADD CONSTRAINT `reject_logs_processStepId_fkey` FOREIGN KEY (`processStepId`) REFERENCES `process_steps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leftover_materials` ADD CONSTRAINT `leftover_materials_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bundles` ADD CONSTRAINT `bundles_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_qr_codes` ADD CONSTRAINT `order_qr_codes_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bundle_qr_codes` ADD CONSTRAINT `bundle_qr_codes_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `bundles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qr_scans` ADD CONSTRAINT `qr_scans_orderQRId_fkey` FOREIGN KEY (`orderQRId`) REFERENCES `order_qr_codes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qr_scans` ADD CONSTRAINT `qr_scans_bundleQRId_fkey` FOREIGN KEY (`bundleQRId`) REFERENCES `bundle_qr_codes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
