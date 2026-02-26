-- YDTechPro Master Governance Schema v18.0
-- Non-destructive extensions for Negotiation Bucket Control & Payment Verification

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. System Settings (Dynamic Control Panel)
CREATE TABLE IF NOT EXISTS `system_settings` (
  `settingKey` varchar(100) NOT NULL,
  `settingValue` text NOT NULL,
  PRIMARY KEY (`settingKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Active Negotiation Registry (Bucket Tracking)
CREATE TABLE IF NOT EXISTS `negotiations` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityId` varchar(255) NOT NULL,
  `entityType` enum('LEAD', 'PRODUCT', 'SERVICE') NOT NULL,
  `buyerId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sellerId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(50) DEFAULT 'NEGOTIATION_STARTED',
  `currentOffer` decimal(15,2) DEFAULT 0.00,
  `messages` json DEFAULT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_buyer_neg` (`buyerId`),
  KEY `idx_seller_neg` (`sellerId`),
  CONSTRAINT `fk_neg_buyer` FOREIGN KEY (`buyerId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_neg_seller` FOREIGN KEY (`sellerId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Payment Confirmation Ledger (Admin Oversight)
CREATE TABLE IF NOT EXISTS `payment_confirmations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adminId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) DEFAULT 'PENDING',
  `amount` decimal(15,2) NOT NULL,
  `timestamp` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Settings
INSERT INTO `system_settings` (settingKey, settingValue) VALUES 
('buyer_max_active_negotiations', '2'),
('seller_max_active_negotiations', '2')
ON DUPLICATE KEY UPDATE settingValue = VALUES(settingValue);

SET FOREIGN_KEY_CHECKS = 1;