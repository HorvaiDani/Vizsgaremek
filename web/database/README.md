# GameHUB – MySQL adatbázis (nagyon egyszerű)

Ha most tanulod a MySQL-t, ez a legegyszerűbb lehetőség: **egy adatbázis, egy tábla**.

## 1. Telepítsd a MySQL-t

- **Windows:** [MySQL letöltés](https://dev.mysql.com/downloads/installer/) → válaszd a legkisebb telepítést.
- **Mac:** `brew install mysql`
- Vagy használj **XAMPP** / **WAMP** – azzal már jön MySQL.

Indítsd el a MySQL szolgáltatást (pl. XAMPP Control Panel → MySQL Start).

---

## 2. Adatbázis és tábla létrehozása

Nyisd meg a **parancssort** (vagy MySQL Workbench-et), menj a projekt mappájába, majd:

```bash
mysql -u root -p < database/schema.sql
```

Ha nincs jelszavad a root-nak (új telepítés), próbáld:

```bash
mysql -u root < database/schema.sql
```

Ez létrehozza a `gamehub` adatbázist és a `kedvencek` táblát.

---

## 3. Szerver indítása (Node)

A projekt gyökeréből:

```bash
npm install
npm run server
```

A szerver a **http://localhost:3001** címen fut.

- **GET**  `http://localhost:3001/api/kedvencek` → kedvencek listája  
- **POST** `http://localhost:3001/api/kedvencek` → új kedvenc (body: `{ "steam_id": "292030", "cim": "The Witcher 3" }`)  
- **DELETE** `http://localhost:3001/api/kedvencek/1` → törlés id alapján  

---

## A tábla egyszerűen

| Oszlop   | Jelentés              |
|----------|------------------------|
| `id`     | Sorszám (autó)         |
| `steam_id` | Steam játék id       |
| `cim`    | Játék címe             |
| `mikor`  | Mentés időpontja       |

Tesztelés SQL-ben:

```sql
USE gamehub;

INSERT INTO kedvencek (steam_id, cim) VALUES ('292030', 'The Witcher 3');
SELECT * FROM kedvencek;
```

Ennyi. 🙂
