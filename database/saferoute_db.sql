-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 10, 2026 at 07:02 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `saferoute_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity` varchar(100) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emergency_contacts`
--

CREATE TABLE `emergency_contacts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `relationship` varchar(100) DEFAULT NULL,
  `phone` varchar(30) NOT NULL,
  `priority` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emergency_services`
--

CREATE TABLE `emergency_services` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `service_type` enum('HOSPITAL','POLICE','FIRE_STATION','AMBULANCE','GARAGE','OTHER') NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `emergency_services`
--

INSERT INTO `emergency_services` (`id`, `name`, `service_type`, `phone`, `email`, `address`, `latitude`, `longitude`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Sample General Hospital', 'HOSPITAL', '0112345678', NULL, 'Colombo', 6.92707900, 79.86124400, 'ACTIVE', '2026-10-07 18:35:09', '2026-10-07 18:35:09'),
(2, 'Sample Police Station', 'POLICE', '0112345679', NULL, 'Colombo', 6.91470000, 79.87300000, 'ACTIVE', '2026-10-07 18:35:09', '2026-10-07 18:35:09');

-- --------------------------------------------------------

--
-- Table structure for table `incidents`
--

CREATE TABLE `incidents` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `incident_type_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `severity` enum('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'LOW',
  `status` enum('PENDING','ASSIGNED','ACCEPTED','IN_PROGRESS','RESOLVED','CANCELLED') DEFAULT 'PENDING',
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `address` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `incidents`
--

INSERT INTO `incidents` (`id`, `user_id`, `incident_type_id`, `title`, `description`, `severity`, `status`, `latitude`, `longitude`, `address`, `created_at`, `updated_at`, `resolved_at`) VALUES
(1, 2, 1, 'vehicle accident on main rode', 'accident', 'MEDIUM', '', 6.93194810, 79.89227710, 'testing', '2026-10-10 07:06:30', '2026-10-10 15:40:58', NULL),
(2, 5, 4, 'fire in company', 'fire', 'CRITICAL', '', 7.02947860, 80.13581190, 'kirindiwella', '2026-10-10 15:37:48', '2026-10-10 15:41:13', NULL),
(3, 2, 2, 'breakdown', 'mm', 'MEDIUM', 'RESOLVED', 7.01012410, 80.28418920, 'mm', '2026-10-10 16:29:39', '2026-10-10 16:30:32', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `incident_images`
--

CREATE TABLE `incident_images` (
  `id` int(11) NOT NULL,
  `incident_id` int(11) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `incident_types`
--

CREATE TABLE `incident_types` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `incident_types`
--

INSERT INTO `incident_types` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'ACCIDENT', 'Road traffic accident or vehicle collision', '2026-10-07 18:35:09'),
(2, 'BREAKDOWN', 'Vehicle breakdown or mechanical failure', '2026-10-07 18:35:09'),
(3, 'ROAD_HAZARD', 'Dangerous road condition or obstacle', '2026-10-07 18:35:09'),
(4, 'FIRE', 'Vehicle or road related fire', '2026-10-07 18:35:09'),
(5, 'MEDICAL_EMERGENCY', 'Medical emergency requiring urgent assistance', '2026-10-07 18:35:09'),
(6, 'OTHER', 'Other road related emergency', '2026-10-07 18:35:09');

-- --------------------------------------------------------

--
-- Table structure for table `incident_updates`
--

CREATE TABLE `incident_updates` (
  `id` int(11) NOT NULL,
  `incident_id` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL,
  `status` enum('PENDING','ASSIGNED','ACCEPTED','IN_PROGRESS','RESOLVED','CANCELLED') NOT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `type` enum('INCIDENT','ASSIGNMENT','EMERGENCY','SYSTEM','GENERAL') DEFAULT 'GENERAL',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 4, 'New incident assignment', 'Incident #1 has been assigned to you. Please review and accept or decline it.', 'ASSIGNMENT', 0, '2026-10-10 13:43:06'),
(2, 4, 'New incident assignment', 'Incident #1 has been assigned to you. Please review and accept or decline it.', 'ASSIGNMENT', 0, '2026-10-10 13:43:08'),
(3, 2, 'Incident Declined', 'Your incident \"vehicle accident on main rode\" has been declined by the SafeRoute administrator.', 'INCIDENT', 1, '2026-10-10 13:51:58'),
(4, 4, 'New incident assignment', 'Incident #1 has been assigned to you. Please review and accept or decline it.', 'ASSIGNMENT', 0, '2026-10-10 13:52:00'),
(5, 4, 'New incident assignment', 'Incident #1 has been assigned to you. Please review and accept or decline it.', 'ASSIGNMENT', 0, '2026-10-10 13:52:10'),
(6, 4, 'New incident assignment', 'Incident #1 has been assigned to you. Please review and accept or decline it.', 'ASSIGNMENT', 0, '2026-10-10 13:52:52'),
(7, 4, 'New incident assignment', 'Incident #1 has been assigned to you. Please review and accept or decline it.', 'ASSIGNMENT', 0, '2026-10-10 13:54:44'),
(8, 2, 'Incident Declined', 'Your incident \"vehicle accident on main rode\" has been declined by the SafeRoute administrator.', 'INCIDENT', 1, '2026-10-10 13:54:49'),
(9, 4, 'New incident assignment', 'Incident #1 has been assigned to you. Please review and accept or decline it.', 'ASSIGNMENT', 1, '2026-10-10 13:59:27'),
(10, 3, 'Assignment accepted', 'Responder #4 accepted assignment #9 for incident #1.', 'ASSIGNMENT', 0, '2026-10-10 14:00:52'),
(11, 3, 'Assignment declined', 'Responder #4 declined assignment #8 for incident #1.', 'ASSIGNMENT', 0, '2026-10-10 14:00:55'),
(12, 3, 'Assignment accepted', 'Responder #4 accepted assignment #7 for incident #1.', 'ASSIGNMENT', 0, '2026-10-10 14:01:01'),
(13, 4, 'New incident assignment', 'Incident #1 has been assigned to you. Please review and accept or decline it.', 'ASSIGNMENT', 0, '2026-10-10 14:07:00'),
(14, 4, 'New incident assignment', 'Incident #1 has been assigned to you. Please review and accept or decline it.', 'ASSIGNMENT', 0, '2026-10-10 14:07:02'),
(15, 4, 'New incident assignment', 'Incident #1 has been assigned to you. Please review and accept or decline it.', 'ASSIGNMENT', 0, '2026-10-10 14:08:14'),
(16, 4, 'New incident assignment', 'Incident #1 has been assigned to you. Please review and accept or decline it.', 'ASSIGNMENT', 0, '2026-10-10 14:12:06'),
(17, 3, 'Assignment accepted', 'Responder #4 accepted assignment #13 for incident #1.', 'ASSIGNMENT', 0, '2026-10-10 14:12:46'),
(18, 4, 'New incident assignment', 'Incident #2 has been assigned to you. Please review and accept or decline it.', 'ASSIGNMENT', 0, '2026-10-10 15:40:50'),
(19, 2, 'Incident Declined', 'Your incident \"vehicle accident on main rode\" has been declined by the SafeRoute administrator.', 'INCIDENT', 0, '2026-10-10 15:40:58'),
(20, 2, 'Incident Declined', 'Your incident \"vehicle accident on main rode\" has been declined by the SafeRoute administrator.', 'INCIDENT', 0, '2026-10-10 15:41:02'),
(21, 2, 'Incident Declined', 'Your incident \"vehicle accident on main rode\" has been declined by the SafeRoute administrator.', 'INCIDENT', 0, '2026-10-10 15:41:05'),
(22, 5, 'Incident Declined', 'Your incident \"fire in company\" has been declined by the SafeRoute administrator.', 'INCIDENT', 0, '2026-10-10 15:41:13'),
(23, 3, 'Assignment declined', 'Responder #4 declined assignment #14 for incident #2.', 'ASSIGNMENT', 0, '2026-10-10 15:42:33'),
(24, 2, 'Incident Declined', 'Your incident \"breakdown\" has been declined by the SafeRoute administrator.', 'INCIDENT', 0, '2026-10-10 16:30:23'),
(25, 4, 'New incident assignment', 'Incident #3 has been assigned to you. Please review and accept or decline it.', 'ASSIGNMENT', 0, '2026-10-10 16:30:34'),
(26, 3, 'Responder accepted incident', 'Test Responder accepted the responder assignment for breakdown (incident #3).', 'ASSIGNMENT', 0, '2026-10-10 16:31:15'),
(27, 2, 'Responder accepted your report', 'A responder has accepted your incident report: breakdown.', 'ASSIGNMENT', 0, '2026-10-10 16:31:15');

-- --------------------------------------------------------

--
-- Table structure for table `responder_assignments`
--

CREATE TABLE `responder_assignments` (
  `id` int(11) NOT NULL,
  `incident_id` int(11) NOT NULL,
  `responder_id` int(11) NOT NULL,
  `status` enum('ASSIGNED','ACCEPTED','REJECTED','ON_THE_WAY','ARRIVED','COMPLETED') DEFAULT 'ASSIGNED',
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `accepted_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `responder_assignments`
--

INSERT INTO `responder_assignments` (`id`, `incident_id`, `responder_id`, `status`, `assigned_at`, `accepted_at`, `completed_at`, `notes`) VALUES
(1, 1, 4, 'ASSIGNED', '2026-10-10 13:25:43', NULL, NULL, NULL),
(2, 1, 4, 'ASSIGNED', '2026-10-10 13:25:48', NULL, NULL, NULL),
(3, 1, 4, 'ASSIGNED', '2026-10-10 13:43:06', NULL, NULL, NULL),
(4, 1, 4, 'ASSIGNED', '2026-10-10 13:43:08', NULL, NULL, NULL),
(5, 1, 4, 'ASSIGNED', '2026-10-10 13:52:00', NULL, NULL, NULL),
(6, 1, 4, 'ASSIGNED', '2026-10-10 13:52:10', NULL, NULL, NULL),
(7, 1, 4, 'ACCEPTED', '2026-10-10 13:52:52', '2026-10-10 14:01:01', NULL, NULL),
(8, 1, 4, '', '2026-10-10 13:54:44', NULL, NULL, NULL),
(9, 1, 4, 'ACCEPTED', '2026-10-10 13:59:27', '2026-10-10 14:00:52', NULL, NULL),
(10, 1, 4, 'ASSIGNED', '2026-10-10 14:07:00', NULL, NULL, NULL),
(11, 1, 4, 'ASSIGNED', '2026-10-10 14:07:02', NULL, NULL, NULL),
(12, 1, 4, 'ASSIGNED', '2026-10-10 14:08:14', NULL, NULL, NULL),
(13, 1, 4, 'ACCEPTED', '2026-10-10 14:12:06', '2026-10-10 14:12:46', NULL, NULL),
(14, 2, 4, '', '2026-10-10 15:40:49', NULL, NULL, NULL),
(15, 3, 4, 'ACCEPTED', '2026-10-10 16:30:34', '2026-10-10 16:31:15', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `created_at`) VALUES
(1, 'ADMIN', '2026-10-07 18:35:09'),
(2, 'RESPONDER', '2026-10-07 18:35:09'),
(3, 'CITIZEN', '2026-10-07 18:35:09');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `profile_image` varchar(500) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','SUSPENDED') DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role_id`, `first_name`, `last_name`, `email`, `password`, `phone`, `profile_image`, `status`, `created_at`, `updated_at`) VALUES
(1, 3, 'Test', 'Citizen', 'citizen@example.com', '$2b$10$Hr08l7c7dQjqNMsWK.w1i.cz8Kn/ICeQwTlwpjXbu1Ut/qmQ0GTgq', '0771234567', NULL, 'ACTIVE', '2026-10-10 05:58:37', '2026-10-10 05:58:37'),
(2, 3, 'Sithmi', 'Nishadini', 'sithmi@gmail.com', '$2b$10$m.2jptTt56H5GhTy5Lt06OdS3/WFTBvq6EGXuqSFEko0Wq8U.WEk6', '0713336333', NULL, 'ACTIVE', '2026-10-10 06:37:49', '2026-10-10 06:37:49'),
(3, 1, 'System', 'Admin', 'admin@saferoute.local', '$2b$10$8DYdGjqiCtUgASZw/KqSwOnjchpqosQ7bNKMMIyCcwMMzsELkXTxm', '0700000000', NULL, 'ACTIVE', '2026-10-10 06:45:58', '2026-10-10 06:45:58'),
(4, 2, 'Test', 'Responder', 'responder@saferoute.local', '$2b$10$FoT0jpSciMLlEgWzDC6kIeCQS/83lmXD48bcO9q4Qoc1MrblIXcne', '0771234567', NULL, 'ACTIVE', '2026-10-10 13:19:34', '2026-10-10 13:19:34'),
(5, 3, 'upunya', 'subodini', 'upunya@gmail.com', '$2b$10$cY7CXo9yu4l0lacXZk21C.WKstdITA1pFmF023OErzGtCYBEqC.FO', '0718978569', NULL, 'ACTIVE', '2026-10-10 15:36:49', '2026-10-10 15:36:49');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_user` (`user_id`),
  ADD KEY `idx_audit_entity` (`entity`,`entity_id`),
  ADD KEY `idx_audit_created` (`created_at`);

--
-- Indexes for table `emergency_contacts`
--
ALTER TABLE `emergency_contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contacts_user` (`user_id`);

--
-- Indexes for table `emergency_services`
--
ALTER TABLE `emergency_services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_service_type` (`service_type`),
  ADD KEY `idx_service_location` (`latitude`,`longitude`);

--
-- Indexes for table `incidents`
--
ALTER TABLE `incidents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_incidents_user` (`user_id`),
  ADD KEY `fk_incidents_type` (`incident_type_id`),
  ADD KEY `idx_incident_status` (`status`),
  ADD KEY `idx_incident_severity` (`severity`),
  ADD KEY `idx_incident_location` (`latitude`,`longitude`),
  ADD KEY `idx_incident_created` (`created_at`);

--
-- Indexes for table `incident_images`
--
ALTER TABLE `incident_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_images_incident` (`incident_id`);

--
-- Indexes for table `incident_types`
--
ALTER TABLE `incident_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `incident_updates`
--
ALTER TABLE `incident_updates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_updates_user` (`updated_by`),
  ADD KEY `idx_updates_incident` (`incident_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user` (`user_id`),
  ADD KEY `idx_notifications_read` (`is_read`);

--
-- Indexes for table `responder_assignments`
--
ALTER TABLE `responder_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_assignment_incident` (`incident_id`),
  ADD KEY `idx_assignment_responder` (`responder_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_role` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `emergency_contacts`
--
ALTER TABLE `emergency_contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `emergency_services`
--
ALTER TABLE `emergency_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `incidents`
--
ALTER TABLE `incidents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `incident_images`
--
ALTER TABLE `incident_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `incident_types`
--
ALTER TABLE `incident_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `incident_updates`
--
ALTER TABLE `incident_updates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `responder_assignments`
--
ALTER TABLE `responder_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `emergency_contacts`
--
ALTER TABLE `emergency_contacts`
  ADD CONSTRAINT `fk_contacts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `incidents`
--
ALTER TABLE `incidents`
  ADD CONSTRAINT `fk_incidents_type` FOREIGN KEY (`incident_type_id`) REFERENCES `incident_types` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_incidents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `incident_images`
--
ALTER TABLE `incident_images`
  ADD CONSTRAINT `fk_images_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `incident_updates`
--
ALTER TABLE `incident_updates`
  ADD CONSTRAINT `fk_updates_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_updates_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `responder_assignments`
--
ALTER TABLE `responder_assignments`
  ADD CONSTRAINT `fk_assignment_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_assignment_responder` FOREIGN KEY (`responder_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
