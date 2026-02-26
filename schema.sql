
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `roles` json DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `is_approved` tinyint(1) DEFAULT 0,
  `is_locked` tinyint(1) DEFAULT 0,
  `pending_role` varchar(50) DEFAULT NULL,
  `auth_provider` varchar(20) DEFAULT 'email',
  `google_id` varchar(255) DEFAULT NULL,
  `profile_image` text NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `gst_number` varchar(50) DEFAULT NULL,
  `company_logo` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `house_no` varchar(50) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `area` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'India',
  `pincode` varchar(20) DEFAULT NULL,
  `concerned_person_name` varchar(255) DEFAULT NULL,
  `concerned_person_contact` varchar(50) DEFAULT NULL,
  `joined_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `payment_exempt` tinyint(1) DEFAULT 0,
  `exemption_scope` enum('none','buyer','seller','both') DEFAULT 'none',
  `exemption_reason` text DEFAULT NULL,
  `exemption_updated_by` varchar(255) DEFAULT NULL,
  `exemption_updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `leads` (
  `id` varchar(255) NOT NULL,
  `buyerId` varchar(255) NOT NULL,
  `buyerName` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `budget` decimal(15,2) DEFAULT 0.00,
  `category` varchar(100) DEFAULT NULL,
  `lead_image` text NOT NULL,
  `quantity` int DEFAULT 1,
  `status` varchar(50) DEFAULT 'OPEN',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `products` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `model_number` varchar(100) DEFAULT NULL,
  `price` decimal(15,2) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `gst_percent` int DEFAULT 18,
  `stock` int DEFAULT 0,
  `specifications` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `availability_type` varchar(50) DEFAULT 'INSTANT',
  `vendor_id` varchar(255) NOT NULL,
  `vendor_name` varchar(255) DEFAULT NULL,
  `product_image` text NOT NULL,
  `status` varchar(50) DEFAULT 'active',
  `installation_required` tinyint(1) DEFAULT 0,
  `installation_cost` decimal(15,2) DEFAULT 0.00,
  `visit_required` tinyint(1) DEFAULT 0,
  `visit_charges` decimal(15,2) DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `lead_id" varchar(255) NOT NULL,
  `razorpay_order_id" varchar(255) NOT NULL,
  `razorpay_payment_id" varchar(255) NOT NULL,
  `razorpay_signature" text NOT NULL,
  `payment_type" enum('buyer_fee', 'seller_fee', 'direct_buy') NOT NULL,
  `amount" decimal(15,2) NOT NULL,
  `currency" varchar(10) DEFAULT 'INR',
  `payment_status" enum('pending', 'paid', 'failed', 'exempt') DEFAULT 'pending',
  `verification_status" enum('pending', 'verified', 'rejected') DEFAULT 'pending',
  `created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `verified_by_admin" tinyint(1) DEFAULT 0,
  `verified_at" timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `lead_id` (`lead_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `services` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `price` decimal(15,2) NOT NULL,
  `unit` varchar(50) DEFAULT 'unit',
  `vendor_id` varchar(255) NOT NULL,
  `is_published` tinyint(1) DEFAULT 1,
  `visit_required` tinyint(1) DEFAULT 0,
  `visit_charges` decimal(15,2) DEFAULT 0.00,
  `installation_required` tinyint(1) DEFAULT 0,
  `installation_cost` decimal(15,2) DEFAULT 0.00,
  `gst_percent` int DEFAULT 18,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
