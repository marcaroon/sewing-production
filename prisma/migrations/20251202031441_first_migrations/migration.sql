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
    `targetDate` DATETIME(3) NOT NULL,
    `totalQuantity` INTEGER NOT NULL,
    `currentStatus` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `assignedLine` VARCHAR(191) NULL,
    `materialsIssued` BOOLEAN NOT NULL DEFAULT false,
    `totalRejected` INTEGER NOT NULL DEFAULT 0,
    `totalRework` INTEGER NOT NULL DEFAULT 0,
    `hasLeftover` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `progressCutting` INTEGER NOT NULL DEFAULT 0,
    `progressNumbering` INTEGER NOT NULL DEFAULT 0,
    `progressShiwake` INTEGER NOT NULL DEFAULT 0,
    `progressSewing` INTEGER NOT NULL DEFAULT 0,
    `progressQc` INTEGER NOT NULL DEFAULT 0,
    `progressIroning` INTEGER NOT NULL DEFAULT 0,
    `progressFinalQc` INTEGER NOT NULL DEFAULT 0,
    `progressPacking` INTEGER NOT NULL DEFAULT 0,
    `wipAtCutting` INTEGER NOT NULL DEFAULT 0,
    `wipAtNumbering` INTEGER NOT NULL DEFAULT 0,
    `wipAtShiwake` INTEGER NOT NULL DEFAULT 0,
    `wipAtSewing` INTEGER NOT NULL DEFAULT 0,
    `wipAtQC` INTEGER NOT NULL DEFAULT 0,
    `wipAtIroning` INTEGER NOT NULL DEFAULT 0,
    `wipAtPacking` INTEGER NOT NULL DEFAULT 0,
    `leadTimeCutting` INTEGER NULL,
    `leadTimeNumbering` INTEGER NULL,
    `leadTimeShiwake` INTEGER NULL,
    `leadTimeSewing` INTEGER NULL,
    `leadTimeQc` INTEGER NULL,
    `leadTimeIroning` INTEGER NULL,
    `leadTimeFinalQc` INTEGER NULL,
    `leadTimePacking` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_orderNumber_key`(`orderNumber`),
    INDEX `orders_buyerId_idx`(`buyerId`),
    INDEX `orders_styleId_idx`(`styleId`),
    INDEX `orders_currentStatus_idx`(`currentStatus`),
    INDEX `orders_orderDate_idx`(`orderDate`),
    INDEX `orders_targetDate_idx`(`targetDate`),
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
CREATE TABLE `transfer_logs` (
    `id` VARCHAR(191) NOT NULL,
    `transferNumber` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `fromDepartment` VARCHAR(191) NOT NULL,
    `toDepartment` VARCHAR(191) NOT NULL,
    `transferDate` DATETIME(3) NOT NULL,
    `handedOverBy` VARCHAR(191) NOT NULL,
    `receivedBy` VARCHAR(191) NOT NULL,
    `processStatus` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `isReceived` BOOLEAN NOT NULL DEFAULT false,
    `receivedDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `transfer_logs_transferNumber_key`(`transferNumber`),
    INDEX `transfer_logs_orderId_idx`(`orderId`),
    INDEX `transfer_logs_transferDate_idx`(`transferDate`),
    INDEX `transfer_logs_processStatus_idx`(`processStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transfer_items` (
    `id` VARCHAR(191) NOT NULL,
    `transferLogId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `bundleNumber` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `condition` VARCHAR(191) NOT NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `transfer_items_transferLogId_idx`(`transferLogId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `process_histories` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `processStatus` VARCHAR(191) NOT NULL,
    `action` TEXT NOT NULL,
    `performedBy` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `duration` INTEGER NULL,
    `notes` TEXT NULL,
    `transferLogId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `process_histories_orderId_idx`(`orderId`),
    INDEX `process_histories_timestamp_idx`(`timestamp`),
    INDEX `process_histories_processStatus_idx`(`processStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reject_logs` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `processStatus` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `reportedBy` VARCHAR(191) NOT NULL,
    `rejectType` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `size` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `images` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `reject_logs_orderId_idx`(`orderId`),
    INDEX `reject_logs_date_idx`(`date`),
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
ALTER TABLE `size_breakdowns` ADD CONSTRAINT `size_breakdowns_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer_logs` ADD CONSTRAINT `transfer_logs_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer_items` ADD CONSTRAINT `transfer_items_transferLogId_fkey` FOREIGN KEY (`transferLogId`) REFERENCES `transfer_logs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `process_histories` ADD CONSTRAINT `process_histories_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `process_histories` ADD CONSTRAINT `process_histories_transferLogId_fkey` FOREIGN KEY (`transferLogId`) REFERENCES `transfer_logs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reject_logs` ADD CONSTRAINT `reject_logs_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
