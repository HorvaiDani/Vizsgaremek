-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Már 15. 13:54
-- Kiszolgáló verziója: 10.4.32-MariaDB
-- PHP verzió: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `gamehub`
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `achievement_catalog`
--

CREATE TABLE `achievement_catalog` (
  `id` varchar(40) NOT NULL,
  `title` varchar(120) NOT NULL,
  `description` varchar(300) NOT NULL,
  `points` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `reward` varchar(200) DEFAULT NULL,
  `metric` varchar(20) DEFAULT NULL,
  `target` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `achievement_catalog`
--

INSERT INTO `achievement_catalog` (`id`, `title`, `description`, `points`, `reward`, `metric`, `target`) VALUES
('all_5', 'Mindenből egy kicsit', 'Legyen meg 5 keresés, 5 megnyitás, 5 kedvenc és 5 komment.', 80, 'Profil-keret: Gyémánt', 'all', 5),
('comment_1', 'Első komment', 'Írtál egy kommentet egy játékhoz.', 10, '„Véleményvezér” jelvény', 'comment', 1),
('comment_10', 'Közösségi arc', 'Írtál 10 kommentet játékokhoz.', 60, 'Rangcím: „Kritikus”', 'comment', 10),
('comment_5', 'Aktív kommentelő', 'Írtál 5 kommentet különböző játékokhoz.', 35, 'Profil-keret: Ezüst', 'comment', 5),
('fav_1', 'Első kedvenc', 'Hozzáadtál egy játékot a kedvenceidhez.', 10, '„Gyűjtögető” jelvény', 'favorite', 1),
('fav_10', 'Kedvenc kurátor', '10 kedvenc játékot összegyűjtöttél.', 50, 'Profil-keret: Arany', 'favorite', 10),
('fav_20', 'Gyűjteményőr', '20 kedvenc játékot gyűjtöttél össze.', 75, 'Profil-keret: Platin', 'favorite', 20),
('fav_5', 'Kedvenc gyűjtögető', 'Legalább 5 kedvenc játékot gyűjtöttél össze.', 25, 'Profil-keret: Bronz', 'favorite', 5),
('login_1', 'Üdv a GameHUB-ban!', 'Bejelentkeztél és létrehoztad a profilod.', 10, 'Profil-keret: Kezdő', 'login', 1),
('open_1', 'Első játék megnyitása', 'Megnyitottál egy játék részletes adatlapot.', 5, 'Felfedező jelvény', 'open', 1),
('open_10', 'Böngésző mester', 'Megnyitottál 10 játék adatlapot.', 40, 'Profil-keret: Ezüst', 'open', 10),
('open_20', 'Mindenevő böngésző', 'Megnyitottál 20 játék adatlapot.', 60, 'Háttér téma: Neon', 'open', 20),
('open_5', 'Kattintgató', 'Megnyitottál 5 játék adatlapot.', 20, '„Felfedező” rangcím', 'open', 5),
('search_1', 'Első keresés', 'Elindítottad az első játékkeresésed a GameHUB-ban.', 5, 'Kereső jelvény', 'search', 1),
('search_10', 'Profi kereső', '10 keresést végrehajtottál a GameHUB-ban.', 30, 'Profil-keret: Bronz', 'search', 10),
('search_20', 'Kereső legenda', '20 keresést végrehajtottál.', 50, 'Profil-keret: Arany', 'search', 20),
('search_5', 'Kezdő kereső', '5 játékra rákerestél a GameHUB-ban.', 15, '„Kíváncsi” rangcím', 'search', 5),
('xp_200', 'Legendás státusz', 'Érd el a 200 össz XP-t.', 0, 'Rang: Legenda', 'xp', 200),
('xp_60', 'Szintlépés', 'Érd el a 60 össz XP-t.', 0, 'Rang: Felfedező', 'xp', 60);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `comments`
--

CREATE TABLE `comments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `steam_app_id` varchar(20) NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `text` varchar(500) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `favorites`
--

CREATE TABLE `favorites` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `steam_app_id` varchar(20) NOT NULL,
  `title` varchar(300) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `genre_preferences`
--

CREATE TABLE `genre_preferences` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `genre` varchar(100) NOT NULL,
  `score` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `opened_games`
--

CREATE TABLE `opened_games` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `steam_app_id` varchar(20) NOT NULL,
  `title` varchar(300) DEFAULT NULL,
  `genre` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `search_history`
--

CREATE TABLE `search_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `query` varchar(200) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(60) NOT NULL,
  `email` varchar(254) DEFAULT NULL,
  `avatar_url` varchar(2048) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `user_achievements`
--

CREATE TABLE `user_achievements` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `achievement_id` varchar(40) NOT NULL,
  `unlocked_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `user_stats`
--

CREATE TABLE `user_stats` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `search_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `opened_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `favorite_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `comment_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `xp` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `achievement_catalog`
--
ALTER TABLE `achievement_catalog`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_comments_game_created` (`steam_app_id`,`created_at`),
  ADD KEY `idx_comments_user_created` (`user_id`,`created_at`);

--
-- A tábla indexei `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_favorites_user_game` (`user_id`,`steam_app_id`),
  ADD KEY `idx_favorites_user_created` (`user_id`,`created_at`);

--
-- A tábla indexei `genre_preferences`
--
ALTER TABLE `genre_preferences`
  ADD PRIMARY KEY (`user_id`,`genre`),
  ADD KEY `idx_genre_preferences_score` (`score`);

--
-- A tábla indexei `opened_games`
--
ALTER TABLE `opened_games`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_opened_games_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_opened_games_game` (`steam_app_id`);

--
-- A tábla indexei `search_history`
--
ALTER TABLE `search_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_search_history_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_search_history_query` (`query`);

--
-- A tábla indexei `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_name` (`name`),
  ADD UNIQUE KEY `uq_users_email` (`email`);

--
-- A tábla indexei `user_achievements`
--
ALTER TABLE `user_achievements`
  ADD PRIMARY KEY (`user_id`,`achievement_id`),
  ADD KEY `idx_user_achievements_unlocked` (`user_id`,`unlocked_at`),
  ADD KEY `fk_user_achievements_achievement` (`achievement_id`);

--
-- A tábla indexei `user_stats`
--
ALTER TABLE `user_stats`
  ADD PRIMARY KEY (`user_id`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `comments`
--
ALTER TABLE `comments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT a táblához `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT a táblához `opened_games`
--
ALTER TABLE `opened_games`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT a táblához `search_history`
--
ALTER TABLE `search_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `genre_preferences`
--
ALTER TABLE `genre_preferences`
  ADD CONSTRAINT `fk_genre_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `opened_games`
--
ALTER TABLE `opened_games`
  ADD CONSTRAINT `fk_opened_games_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `search_history`
--
ALTER TABLE `search_history`
  ADD CONSTRAINT `fk_search_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `user_achievements`
--
ALTER TABLE `user_achievements`
  ADD CONSTRAINT `fk_user_achievements_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievement_catalog` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_achievements_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `user_stats`
--
ALTER TABLE `user_stats`
  ADD CONSTRAINT `fk_user_stats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
