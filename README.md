# Adatbázis Alapú Raktár- és Nyilvántartó Rendszer 📦

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=2,3,4&height=180&section=header&text=Adatb%C3%A1zis%20Alap%C3%BA%20Nyilv%C3%A1ntart%C3%B3&fontSize=38&fontAlignY=35&desc=Fullstack%20K%C3%A9szletkezel%C5%91%20%E2%80%A2%20React%2019%20%2B%20PHP%208%20REST%20API%20%2B%20MySQL&descAlignY=60&descSize=16&fontColor=ffffff" width="100%" alt="Header Banner" />
</p>

<p align="center">
  <a href="https://jannn1.hu/nyilvantarto"><img src="https://img.shields.io/badge/▶_Élő_Kipróbálás-jannn1.hu%2Fnyilvantarto-6366f1?style=for-the-badge&logoColor=white" alt="Live Demo" /></a>
  <img src="https://img.shields.io/badge/Frontend-React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Backend-PHP_8_REST_API-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP 8" />
  <img src="https://img.shields.io/badge/Adatbázis-MySQL_Relációk-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Stílus-Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Biztonság-PDO_Prepared_Statements-22c55e?style=for-the-badge" alt="Security" />
</p>

---

## 📌 Áttekintés

A rendszer egy modern, nagyvállalati szemléletű **Fullstack Raktár- és Eszköznyilvántartó Alkalmazás**, amelyet **Ár János Dániel** (ELTE IK BSc hallgató) tervezett és fejlesztett.

A projekt célja egy olyan átlátható, villámgyors és biztonságos készletkezelő rendszer megvalósítása, amely valós idejű KPI dashboarddal, intelligens készletfigyelő riasztásokkal, relációs MySQL háttérrel és azonnali Excel/CSV exportálással segíti a logisztikai és IT leltározási feladatokat.

> 🌐 **Élő, működő alkalmazás tesztelése:** [https://jannn1.hu/nyilvantarto](https://jannn1.hu/nyilvantarto)

---

## 🚀 Főbb Funkciók

- 📊 **Valós Idejű Vezérlőpult (KPI Dashboard):**
  - Összes nyilvántartott eszköz és fizikai darabszám összesítés
  - Raktár teljes nettó összértéke (HUF) dinamikus forint formázással
  - Automatikus riasztási mutatók: *Kifogyóban lévő (low stock)*, *Kifogyott (out of stock)* és *Rendelés alatt (ordered)* állagok.
- 🏷️ **Dinamikus Kategóriakezelés:**
  - Kategóriák szerkesztése, létrehozása egyedi Tailwind színkódokkal és Lucide ikonokkal (`Laptop`, `Network`, `Keyboard`, `Printer` stb.).
  - Kategóriánkénti automatikus leltárérték- és darabszám-összesítés.
- ⚡ **1-Kattintásos Készletmódosítás (Quick Adjust):**
  - Azonnali készletnövelés és -csökkentés a táblázat soraiból.
  - Automatikus státuszváltás: ha a készlet eléri a 0-t, azonnal átvált *Kifogyott* státuszra; ha a minimum szint alá esik, *Kifogyóban* jelzést kap.
- 🔍 **Többszempontú Keresés & Szűrés:**
  - Valós idejű gépeléskori keresés: tételnév, cikkszám (SKU), tárolási hely vagy megjegyzés szerint.
  - Szűrés kategóriák és készletállapotok szerint.
  - Rendezés (ASC / DESC) név, cikkszám, készlet, egységár, kategória és rögzítési dátum alapján.
- 📥 **Excel-Kompatibilis CSV Export:**
  - Letölthető leltárriport pontos dátumbélyegzővel.
  - **UTF-8 BOM** karakterkódolás, így a Microsoft Excel hibátlanul, azonnal jeleníti meg a magyar ékezetes karaktereket (ő, ű, á, é).
- 🔄 **1-Kattintásos Mintaadat Visszaállítás (Demo Reset):**
  - Bármikor egyetlen gombnyomással újrainicializálható a tesztkörnyezet az eredeti mintaadatokkal.

---

## 🛡️ Biztonsági Architektúra & Adatvédelem

A projekt szigorúan követi a modern biztonsági szabványokat:
1. **Zéró Jelszószivárgás a Verziókövetésben:**
   - A valós adatbázis hozzáféréseket a Git tároló **nem tartalmazza** (a `.gitignore` szabályai védik).
   - A konfiguráció a csatolt `db_config.example.php` vagy a `.env.example` mintafájlok alapján, lokálisan vagy környezeti változókból (`getenv()`) töltődik be.
2. **SQL Injection Elleni Teljes Védelem:**
   - 100%-ban **PDO Prepared Statements** (paraméterezett lekérdezések) kerültek implementálásra minden SELECT, INSERT, UPDATE és DELETE műveletnél.
3. **CORS & Biztonsági HTTP Fejlécek:**
   - A `security.php` modul gondoskodik a szigorú fejléc-beállításokról (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`).

---

## 🏗️ Rendszerarchitektúra

```mermaid
flowchart LR
    subgraph Kliensoldal ["Frontend (Böngésző)"]
        UI["React 19 SPA"]
        Tailwind["Tailwind CSS v4 + Lucide"]
    end

    subgraph Kiszolgáló ["Backend REST API (PHP 8.x)"]
        API["inventory.php"]
        Security["security.php (CORS & Fejlécek)"]
        DB["db.php (PDO Kapcsolat)"]
        Config["db_config.php / .env"]
    end

    subgraph Adattár ["Relációs Adatbázis"]
        MySQL[("MySQL 8.x InnoDB")]
    end

    UI -->|"Fetch JSON kérések"| API
    API --> Security
    API --> DB
    DB --> Config
    DB -->|"PDO Prepared Queries"| MySQL
    MySQL -->|"Eredményhalmaz"| DB
    DB -->|"JSON Válasz / CSV Stream"| UI
```

---

## 🗄️ Relációs Adatbázis Modell (ERD)

```mermaid
erDiagram
    INVENTORY_CATEGORIES ||--o{ INVENTORY_ITEMS : "tartalmaz (1:N)"
    
    INVENTORY_CATEGORIES {
        int id PK "Azonosító"
        string name "Kategória megnevezés"
        string slug UK "Egyedi keresőbarát azonosító"
        string color "Tailwind szín (pl. emerald, cyan)"
        string icon "Lucide ikon neve"
        string description "Kategória leírása"
        datetime created_at "Létrehozva"
    }

    INVENTORY_ITEMS {
        int id PK "Azonosító"
        int category_id FK "Külső kulcs -> INVENTORY_CATEGORIES"
        string sku UK "Egyedi cikkszám / vonalkód"
        string name "Eszköz megnevezése"
        int quantity "Aktuális készlet"
        int min_quantity "Minimális készlet figyelmeztetés"
        decimal unit_price "Nettó egységár (HUF)"
        string location "Raktári lokáció / polc"
        enum status "in_stock, low_stock, out_of_stock, ordered"
        text notes "Műszaki leírás, paraméterek"
        datetime created_at "Rögzítés ideje"
        datetime updated_at "Módosítás ideje"
    }
```

---

## 📡 REST API Végpontok

A backend a `api/inventory.php` fájlon keresztül szolgálja ki a kéréseket:

| Metódus | Paraméter (`action`) | Leírás | Főbb paraméterek / Törzs |
| :--- | :--- | :--- | :--- |
| `GET` | `?action=list` | Tételek listázása összekapcsolt kategória adatokkal | `q`, `category_id`, `status`, `sort_by`, `sort_order` |
| `GET` | `?action=stats` | Összesített KPI statisztikák és kategória bontás | - |
| `POST` | `?action=create` | Új tétel rögzítése automatikus SKU ellenőrzéssel | `sku`, `name`, `category_id`, `quantity`, `unit_price`, `location` |
| `POST` | `?action=update` | Meglévő tétel adatainak módosítása | `id`, `sku`, `name`, `category_id`, `quantity`, `unit_price` |
| `POST` | `?action=delete` | Tétel végleges törlése az adatbázisból | `id` |
| `POST` | `?action=adjust_stock` | Gyors készletkorrekció (+1 / -1) | `id`, `delta` (`+1` vagy `-1`) |
| `GET` | `?action=export_csv` | UTF-8 BOM kódolású letölthető CSV generálás | - |
| `POST` | `?action=reset_demo` | Teljes demó adatkészlet visszaállítása | - |
| `POST` | `?action=create_category` | Új kategória felvétele | `name`, `color`, `icon`, `description` |
| `POST` | `?action=update_category` | Kategória adatainak módosítása | `id`, `name`, `color`, `icon`, `description` |
| `POST` | `?action=delete_category` | Kategória törlése (ha nincs hozzárendelt tétel) | `id` |

---

## 💻 Helyi Futtatás & Telepítés (Local Setup)

### 1. Előfeltételek
- **PHP 8.0+** (PDO és pdo_mysql kiterjesztéssel)
- **MySQL 5.7+ vagy 8.0+** (vagy MariaDB)
- Node.js 18+ (amennyiben a React komponenst külön fejlesztői környezetben futtatod)

### 2. Adatbázis Létrehozása
Importáld be a mellékelt `database/schema.sql` fájlt a MySQL adatbázisodba (pl. phpMyAdmin felületen vagy parancssorból):
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p inventory_db < database/schema.sql
```

### 3. Konfiguráció Beállítása
Másold le a minta konfigurációt:
```bash
cp api/db_config.example.php api/db_config.php
```
Nyisd meg a `api/db_config.php` fájlt, és add meg a saját helyi adatbázisod jelszavát:
```php
return [
    'host' => 'localhost',
    'name' => 'inventory_db',
    'user' => 'root',
    'pass' => 'a_te_jelszavad',
];
```

### 4. API Szerver Indítása
A backend azonnal tesztelhető a PHP beépített fejlesztői szerverével:
```bash
php -S localhost:8000 -t .
```
Ezután az API elérhető a `http://localhost:8000/api/inventory.php?action=list` címen!

---

## 👨‍💻 Fejlesztő

**Ár János Dániel**  
- 🎓 *Eötvös Loránd Tudományegyetem (ELTE IK) – Programtervező informatikus (BSc)*
- 🌐 Hivatalos Portfólió: [https://jannn1.hu](https://jannn1.hu)
- ✉️ Kapcsolat: [info@jannn1.hu](mailto:info@jannn1.hu)
- 🐙 GitHub Profil: [@Jannn1](https://github.com/Jannn1)
