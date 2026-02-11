-- ============================================
-- GameHUB adatbázis – nagyon egyszerű, kezdőnek
-- ============================================
-- Futtatás: MySQL-ben (pl. MySQL Workbench, vagy parancssor):
--   mysql -u root -p < database/schema.sql
-- ============================================

-- 1. Adatbázis létrehozása
CREATE DATABASE IF NOT EXISTS gamehub;

-- 2. Ezt használjuk
USE gamehub;

-- 3. Egyetlen tábla: kedvenc játékok
--    (mintha csak most tanulnád a MySQL-t – ennél egyszerűbb nincs)
CREATE TABLE IF NOT EXISTS kedvencek (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  steam_id     VARCHAR(20)  NOT NULL COMMENT 'Steam játék azonosító',
  cim         VARCHAR(300) NOT NULL COMMENT 'Játék címe',
  mikor       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT 'Mikor mentettük'
);

-- Kész. Ennyi. Egy tábla, négy oszlop.
-- Kedvenc felvétel: INSERT INTO kedvencek (steam_id, cim) VALUES ('292030', 'The Witcher 3');
-- Listázás: SELECT * FROM kedvencek;
