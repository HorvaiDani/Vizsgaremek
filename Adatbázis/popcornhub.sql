-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: popcornhub
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `felhasznalo`
--

DROP TABLE IF EXISTS `felhasznalo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `felhasznalo` (
  `felhasznalo_id` int NOT NULL AUTO_INCREMENT,
  `Felhasznalo_nev` varchar(50) DEFAULT NULL,
  `felhasznalo_kor` int DEFAULT NULL,
  `elozmenyek` varchar(50) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `jelszo` varchar(50) DEFAULT NULL,
  `datum` date DEFAULT NULL,
  PRIMARY KEY (`felhasznalo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `felhasznalo`
--

LOCK TABLES `felhasznalo` WRITE;
/*!40000 ALTER TABLE `felhasznalo` DISABLE KEYS */;
/*!40000 ALTER TABLE `felhasznalo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `velemeny`
--

DROP TABLE IF EXISTS `velemeny`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `velemeny` (
  `velemeny_id` int NOT NULL AUTO_INCREMENT,
  `szoveg` varchar(500) DEFAULT NULL,
  `datum` date DEFAULT NULL,
  `felhasznalo_id` int DEFAULT NULL,
  PRIMARY KEY (`velemeny_id`),
  KEY `felhasznalo_id` (`felhasznalo_id`),
  CONSTRAINT `velemeny_ibfk_1` FOREIGN KEY (`felhasznalo_id`) REFERENCES `felhasznalo` (`felhasznalo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `velemeny`
--

LOCK TABLES `velemeny` WRITE;
/*!40000 ALTER TABLE `velemeny` DISABLE KEYS */;
/*!40000 ALTER TABLE `velemeny` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-26  2:00:54
