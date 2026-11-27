-- Transportayo schema export. Import into an empty database, then run npm run db:seed.
CREATE DATABASE IF NOT EXISTS transportayo_prototype CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE transportayo_prototype;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `firstName` varchar(50) NOT NULL,
  `lastName` varchar(50) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `dateRegistered` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `deactivatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_b8512aa9cef03d90ed5744c94d` (`userId`),
  UNIQUE KEY `IDX_88acd889fbe17d0e16cc4bc917` (`phone`),
  UNIQUE KEY `REL_b8512aa9cef03d90ed5744c94d` (`userId`),
  CONSTRAINT `FK_b8512aa9cef03d90ed5744c94d7` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `drivers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `firstName` varchar(50) NOT NULL,
  `lastName` varchar(50) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `licenseNumber` varchar(30) NOT NULL,
  `status` enum('available','busy','inactive') NOT NULL DEFAULT 'available',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_57d866371f392f459cd9ee46f6` (`userId`),
  UNIQUE KEY `IDX_b97a5a68c766d2d1ec25e6a85b` (`phone`),
  UNIQUE KEY `IDX_754b3d50a8cc64f7ad5c24f62b` (`licenseNumber`),
  UNIQUE KEY `REL_57d866371f392f459cd9ee46f6` (`userId`),
  CONSTRAINT `FK_57d866371f392f459cd9ee46f6a` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rideId` int(11) NOT NULL,
  `paymentDateTime` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `amount` decimal(10,2) unsigned NOT NULL,
  `method` enum('cash','card','e-wallet') NOT NULL,
  `status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_e979c43b9a5f2bcfb69ee795a6` (`rideId`),
  UNIQUE KEY `REL_e979c43b9a5f2bcfb69ee795a6` (`rideId`),
  CONSTRAINT `FK_e979c43b9a5f2bcfb69ee795a6a` FOREIGN KEY (`rideId`) REFERENCES `rides` (`id`) ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rides` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customerId` int(11) NOT NULL,
  `driverId` int(11) DEFAULT NULL,
  `vehicleId` int(11) DEFAULT NULL,
  `pickupLocation` varchar(255) NOT NULL,
  `dropoffLocation` varchar(255) NOT NULL,
  `requestDateTime` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `status` enum('requested','accepted','in-progress','completed','cancelled') NOT NULL DEFAULT 'requested',
  `fare` decimal(10,2) unsigned NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `FK_b9ddf043eacd294d3b3b73c6195` (`customerId`),
  KEY `IDX_5033f2353411e9914122c0eb52` (`driverId`,`status`),
  KEY `FK_75e480e353cb430ffbb664bbb07` (`vehicleId`),
  CONSTRAINT `FK_0adda088d567495e71d21b6c691` FOREIGN KEY (`driverId`) REFERENCES `drivers` (`id`) ON UPDATE NO ACTION,
  CONSTRAINT `FK_75e480e353cb430ffbb664bbb07` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`id`) ON UPDATE NO ACTION,
  CONSTRAINT `FK_b9ddf043eacd294d3b3b73c6195` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(254) NOT NULL,
  `passwordHash` varchar(60) NOT NULL,
  `role` enum('customer','driver','admin') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `driverId` int(11) NOT NULL,
  `plateNumber` varchar(15) NOT NULL,
  `make` varchar(50) NOT NULL,
  `model` varchar(50) NOT NULL,
  `vehicleYear` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_66ea96381a7a7ceb35c72f3662` (`plateNumber`),
  KEY `FK_28d7607488252336b22511e9e80` (`driverId`),
  CONSTRAINT `FK_28d7607488252336b22511e9e80` FOREIGN KEY (`driverId`) REFERENCES `drivers` (`id`) ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
