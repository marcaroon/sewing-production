-- CreateTable
CREATE TABLE `materials` (
    `id` VARCHAR(191) NOT NULL,
    `materialCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NULL,
    `supplier` VARCHAR(191) NULL,
    `minimumStock` DOUBLE NOT NULL DEFAULT 0,
    `reorderPoint` DOUBLE NOT NULL DEFAULT 0,
    `unitPrice` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `materials_materialCode_key`(`materialCode`),
    INDEX `materials_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accessories` (
    `id` VARCHAR(191) NOT NULL,
    `accessoryCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NULL,
    `size` VARCHAR(191) NULL,
    `supplier` VARCHAR(191) NULL,
    `minimumStock` INTEGER NOT NULL DEFAULT 0,
    `reorderPoint` INTEGER NOT NULL DEFAULT 0,
    `unitPrice` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `accessories_accessoryCode_key`(`accessoryCode`),
    INDEX `accessories_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_stock_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `transactionType` VARCHAR(191) NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `referenceType` VARCHAR(191) NULL,
    `referenceId` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `performedBy` VARCHAR(191) NOT NULL,
    `transactionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `material_stock_transactions_materialId_idx`(`materialId`),
    INDEX `material_stock_transactions_transactionDate_idx`(`transactionDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accessory_stock_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `accessoryId` VARCHAR(191) NOT NULL,
    `transactionType` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `referenceType` VARCHAR(191) NULL,
    `referenceId` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `performedBy` VARCHAR(191) NOT NULL,
    `transactionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `accessory_stock_transactions_accessoryId_idx`(`accessoryId`),
    INDEX `accessory_stock_transactions_transactionDate_idx`(`transactionDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_materials` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `quantityRequired` DOUBLE NOT NULL,
    `quantityIssued` DOUBLE NOT NULL DEFAULT 0,
    `quantityUsed` DOUBLE NOT NULL DEFAULT 0,
    `quantityReturned` DOUBLE NOT NULL DEFAULT 0,
    `quantityWasted` DOUBLE NOT NULL DEFAULT 0,
    `unit` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `order_materials_orderId_idx`(`orderId`),
    INDEX `order_materials_materialId_idx`(`materialId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_accessories` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `accessoryId` VARCHAR(191) NOT NULL,
    `quantityRequired` INTEGER NOT NULL,
    `quantityIssued` INTEGER NOT NULL DEFAULT 0,
    `quantityUsed` INTEGER NOT NULL DEFAULT 0,
    `quantityReturned` INTEGER NOT NULL DEFAULT 0,
    `quantityWasted` INTEGER NOT NULL DEFAULT 0,
    `unit` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `order_accessories_orderId_idx`(`orderId`),
    INDEX `order_accessories_accessoryId_idx`(`accessoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_usages` (
    `id` VARCHAR(191) NOT NULL,
    `processStepId` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `quantityUsed` DOUBLE NOT NULL,
    `quantityWasted` DOUBLE NOT NULL DEFAULT 0,
    `unit` VARCHAR(191) NOT NULL,
    `usedBy` VARCHAR(191) NOT NULL,
    `usageDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `material_usages_processStepId_idx`(`processStepId`),
    INDEX `material_usages_materialId_idx`(`materialId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accessory_usages` (
    `id` VARCHAR(191) NOT NULL,
    `processStepId` VARCHAR(191) NOT NULL,
    `accessoryId` VARCHAR(191) NOT NULL,
    `quantityUsed` INTEGER NOT NULL,
    `quantityWasted` INTEGER NOT NULL DEFAULT 0,
    `unit` VARCHAR(191) NOT NULL,
    `usedBy` VARCHAR(191) NOT NULL,
    `usageDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `accessory_usages_processStepId_idx`(`processStepId`),
    INDEX `accessory_usages_accessoryId_idx`(`accessoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `material_stock_transactions` ADD CONSTRAINT `material_stock_transactions_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accessory_stock_transactions` ADD CONSTRAINT `accessory_stock_transactions_accessoryId_fkey` FOREIGN KEY (`accessoryId`) REFERENCES `accessories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_materials` ADD CONSTRAINT `order_materials_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_materials` ADD CONSTRAINT `order_materials_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_accessories` ADD CONSTRAINT `order_accessories_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_accessories` ADD CONSTRAINT `order_accessories_accessoryId_fkey` FOREIGN KEY (`accessoryId`) REFERENCES `accessories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_usages` ADD CONSTRAINT `material_usages_processStepId_fkey` FOREIGN KEY (`processStepId`) REFERENCES `process_steps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_usages` ADD CONSTRAINT `material_usages_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accessory_usages` ADD CONSTRAINT `accessory_usages_processStepId_fkey` FOREIGN KEY (`processStepId`) REFERENCES `process_steps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accessory_usages` ADD CONSTRAINT `accessory_usages_accessoryId_fkey` FOREIGN KEY (`accessoryId`) REFERENCES `accessories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
