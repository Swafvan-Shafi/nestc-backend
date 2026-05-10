SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` text NOT NULL,
  `role` enum('student','admin','security','operator') NOT NULL DEFAULT 'student',
  `hostel` varchar(50) DEFAULT NULL,
  `room_number` varchar(20) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `fcm_token` text,
  `is_verified` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `drivers` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `vehicle_number` varchar(20) NOT NULL,
  `vehicle_type` enum('auto','taxi') NOT NULL,
  `status` enum('available','busy','offline') DEFAULT 'offline',
  `last_latitude` decimal(9,6) DEFAULT NULL,
  `last_longitude` decimal(9,6) DEFAULT NULL,
  `location_updated_at` timestamp NULL DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT '0',
  `total_trips` int DEFAULT '0',
  `rating` decimal(2,1) DEFAULT '5.0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `vehicle_number` (`vehicle_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `hostels` (
  `id` varchar(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `type` enum('boys','girls','faculty') NOT NULL,
  `block_count` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `listings` (
  `id` varchar(36) NOT NULL,
  `seller_id` varchar(36) NOT NULL,
  `type` enum('have','want') NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text,
  `category` enum('books','stationery','electronics','lab','clothes','cycles','other') NOT NULL,
  `price` decimal(8,2) DEFAULT NULL,
  `is_urgent` tinyint(1) DEFAULT '0',
  `is_free` tinyint(1) DEFAULT '0',
  `status` enum('active','traded','expired','removed') DEFAULT 'active',
  `views_count` int DEFAULT '0',
  `expires_at` timestamp NULL DEFAULT NULL,
  `traded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `seller_id` (`seller_id`),
  CONSTRAINT `listings_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `bookings` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `student_id` varchar(36) NOT NULL,
  `driver_id` varchar(36) DEFAULT NULL,
  `vehicle_type` enum('auto','taxi') NOT NULL,
  `pickup_location` varchar(100) NOT NULL,
  `destination` varchar(100) NOT NULL,
  `hostel` varchar(50) NOT NULL,
  `scheduled_time` timestamp NULL DEFAULT NULL,
  `status` enum('pending','accepted','arrived','completed','cancelled') NOT NULL DEFAULT 'pending',
  `booking_code` varchar(6) NOT NULL,
  `gate_pass_url` text,
  `gate_pass_expires_at` timestamp NULL DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `arrived_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `pickup_lat` decimal(10,8) DEFAULT NULL,
  `pickup_lng` decimal(11,8) DEFAULT NULL,
  `pass_id` varchar(255) DEFAULT NULL,
  `driver_response` varchar(50) DEFAULT 'pending',
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_code` (`booking_code`),
  UNIQUE KEY `pass_id` (`pass_id`),
  KEY `student_id` (`student_id`),
  KEY `driver_id` (`driver_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `booking_driver_pings` (
  `id` varchar(36) NOT NULL,
  `booking_id` varchar(36) NOT NULL,
  `driver_id` varchar(36) NOT NULL,
  `whatsapp_sent_at` timestamp NULL DEFAULT NULL,
  `response` enum('accepted','rejected','timeout') DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `driver_id` (`driver_id`),
  CONSTRAINT `booking_driver_pings_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `booking_driver_pings_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `chats` (
  `id` varchar(36) NOT NULL,
  `listing_id` varchar(36) DEFAULT NULL,
  `buyer_id` varchar(36) NOT NULL,
  `seller_id` varchar(36) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `listing_id` (`listing_id`),
  KEY `buyer_id` (`buyer_id`),
  KEY `seller_id` (`seller_id`),
  CONSTRAINT `chats_ibfk_1` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`),
  CONSTRAINT `chats_ibfk_2` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chats_ibfk_3` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `chat_messages` (
  `id` varchar(36) NOT NULL,
  `chat_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `content` longtext,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `listing_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `chat_id` (`chat_id`),
  KEY `sender_id` (`sender_id`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `email_verifications` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `email_verifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `gate_passes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pass_id` varchar(255) NOT NULL,
  `student_roll` varchar(100) NOT NULL,
  `student_name` varchar(100) NOT NULL,
  `driver_name` varchar(100) NOT NULL,
  `vehicle_number` varchar(100) NOT NULL,
  `pickup_location` varchar(255) NOT NULL,
  `drop_location` varchar(255) NOT NULL,
  `booking_time` timestamp NOT NULL,
  `expires_at` timestamp NOT NULL,
  `status` varchar(50) DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `pass_id` (`pass_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `listing_interests` (
  `id` varchar(36) NOT NULL,
  `listing_id` varchar(36) NOT NULL,
  `buyer_id` varchar(36) NOT NULL,
  `message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `listing_id` (`listing_id`,`buyer_id`),
  KEY `buyer_id` (`buyer_id`),
  CONSTRAINT `listing_interests_ibfk_1` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `listing_interests_ibfk_2` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `listing_photos` (
  `id` varchar(36) NOT NULL,
  `listing_id` varchar(36) NOT NULL,
  `photo_url` longtext NOT NULL,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `listing_id` (`listing_id`),
  CONSTRAINT `listing_photos_ibfk_1` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `nitc_registered_emails` (
  `email` varchar(150) NOT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(100) NOT NULL,
  `body` text NOT NULL,
  `data` json DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `otps` (
  `email` varchar(150) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `user_data` json DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sessions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `jwt_token` text NOT NULL,
  `device_info` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `vending_machines` (
  `id` varchar(36) NOT NULL,
  `hostel_id` varchar(36) NOT NULL,
  `location_description` varchar(100) NOT NULL,
  `operator_id` varchar(36) DEFAULT NULL,
  `last_refilled_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `hostel_id` (`hostel_id`),
  KEY `operator_id` (`operator_id`),
  CONSTRAINT `vending_machines_ibfk_1` FOREIGN KEY (`hostel_id`) REFERENCES `hostels` (`id`),
  CONSTRAINT `vending_machines_ibfk_2` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `vending_items` (
  `id` varchar(36) NOT NULL,
  `machine_id` varchar(36) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `slot_code` varchar(10) NOT NULL,
  `price` decimal(6,2) NOT NULL,
  `current_stock` int DEFAULT '0',
  `max_stock` int NOT NULL,
  `low_stock_threshold` int DEFAULT '3',
  `image_url` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `machine_id` (`machine_id`),
  CONSTRAINT `vending_items_ibfk_1` FOREIGN KEY (`machine_id`) REFERENCES `vending_machines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `vending_stock_logs` (
  `id` varchar(36) NOT NULL,
  `item_id` varchar(36) NOT NULL,
  `previous_stock` int NOT NULL,
  `new_stock` int NOT NULL,
  `updated_by` varchar(36) DEFAULT NULL,
  `note` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `vending_stock_logs_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `vending_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vending_stock_logs_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `vending_subscriptions` (
  `id` varchar(36) NOT NULL,
  `student_id` varchar(36) NOT NULL,
  `machine_id` varchar(36) NOT NULL,
  `notify_on_refill` tinyint(1) DEFAULT '1',
  `notify_on_low` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`,`machine_id`),
  KEY `machine_id` (`machine_id`),
  CONSTRAINT `vending_subscriptions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vending_subscriptions_ibfk_2` FOREIGN KEY (`machine_id`) REFERENCES `vending_machines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
