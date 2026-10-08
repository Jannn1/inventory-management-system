-- ========================================================
-- Adatbázis Alapú Raktár- és Nyilvántartó Rendszer (MySQL)
-- Készítette: Ár János Dániel (ELTE IK BSc)
-- https://jannn1.hu/nyilvantarto
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. Tábla létrehozása: Kategóriák (`inventory_categories`)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `inventory_items`;
DROP TABLE IF EXISTS `inventory_categories`;

CREATE TABLE `inventory_categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL COMMENT 'Kategória megnevezése',
    `slug` VARCHAR(50) NOT NULL UNIQUE COMMENT 'URL- és gépbarát azonosító',
    `color` VARCHAR(30) DEFAULT 'indigo' COMMENT 'Tailwind színkód (emerald, cyan, purple, stb.)',
    `icon` VARCHAR(30) DEFAULT 'Folder' COMMENT 'Lucide ikon megnevezése',
    `description` VARCHAR(255) DEFAULT '' COMMENT 'Rövid összefoglaló leírás',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Létrehozás időpontja'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Eszközkategóriák és besorolások';

-- --------------------------------------------------------
-- 2. Tábla létrehozása: Eszközök és Termékek (`inventory_items`)
-- --------------------------------------------------------
CREATE TABLE `inventory_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT NOT NULL COMMENT 'Külső kulcs a kategóriára',
    `sku` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Egyedi cikkszám / vonalkód',
    `name` VARCHAR(150) NOT NULL COMMENT 'Eszköz vagy termék megnevezése',
    `quantity` INT NOT NULL DEFAULT 0 COMMENT 'Jelenlegi raktári készlet darabszáma',
    `min_quantity` INT NOT NULL DEFAULT 5 COMMENT 'Minimális készlet figyelmeztetési küszöb',
    `unit_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Nettó egységár (HUF)',
    `location` VARCHAR(100) DEFAULT 'Főraktár' COMMENT 'Fizikai tárolási hely vagy polc',
    `status` ENUM('in_stock', 'low_stock', 'out_of_stock', 'ordered') NOT NULL DEFAULT 'in_stock' COMMENT 'Készletstátusz',
    `notes` TEXT DEFAULT NULL COMMENT 'Műszaki paraméterek és megjegyzések',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Rögzítés időpontja',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Utolsó módosítás',
    
    INDEX `idx_category` (`category_id`),
    INDEX `idx_sku` (`sku`),
    INDEX `idx_status` (`status`),
    
    CONSTRAINT `fk_inventory_category` 
        FOREIGN KEY (`category_id`) REFERENCES `inventory_categories` (`id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Raktári készlet és nyilvántartott eszközök';

-- --------------------------------------------------------
-- 3. Alapértelmezett kategória adatok (Demo Seed)
-- --------------------------------------------------------
INSERT INTO `inventory_categories` (`id`, `name`, `slug`, `color`, `icon`, `description`) VALUES
(1, 'IT Hardver & Munkaállomások', 'hardware', 'emerald', 'Laptop', 'Számítógépek, laptopok, monitorok és munkaállomások'),
(2, 'Hálózati Infrastruktúra', 'networking', 'cyan', 'Network', 'Switchek, routerek, access pointok és rack kábelezés'),
(3, 'Perifériák & Kiegészítők', 'peripherals', 'purple', 'Keyboard', 'Billentyűzetek, professzionális egerek és dokkolók'),
(4, 'Szoftver Licencek & Felhő', 'software', 'indigo', 'FileCode', 'Operációs rendszerek, fejlesztői és irodai licencek'),
(5, 'Irodatechnika & Kellékek', 'office', 'amber', 'Printer', 'Nyomtatók, tonerek, tápegységek és irodai eszközök');

-- --------------------------------------------------------
-- 4. Alapértelmezett eszköz / termék tételek (Demo Seed)
-- --------------------------------------------------------
INSERT INTO `inventory_items` (`category_id`, `sku`, `name`, `quantity`, `min_quantity`, `unit_price`, `location`, `status`, `notes`) VALUES
(1, 'HW-DELL-5530', 'Dell Latitude 5530 i7 Laptop', 14, 3, 385000.00, 'Központi Raktár A/1', 'in_stock', 'Intel Core i7-1265U, 16GB RAM, 512GB NVMe SSD, Win11 Pro'),
(1, 'HW-LG-27UP', 'LG UltraFine 27" 4K IPS Monitor', 8, 2, 129000.00, 'Központi Raktár A/2', 'in_stock', '3840x2160 felbontás, 99% sRGB, USB-C 90W PD töltéssel'),
(1, 'HW-M3-PRO', 'Apple MacBook Pro 14" M3 Pro', 2, 3, 849000.00, 'Páncélszekrény / VIP', 'low_stock', '18GB Unified Memory, 512GB SSD, Asztroszürke, tesztelői gép'),
(2, 'NET-CIS-2960', 'Cisco Catalyst 2960-X 24p Gigabit Switch', 4, 1, 215000.00, 'Szerverszoba - Rack 02', 'in_stock', '24 Port PoE+, 4x 1G SFP uplink, menedzselt L2 réteg'),
(2, 'NET-UBI-U6', 'UniFi 6 Pro WiFi Access Point', 1, 2, 68000.00, 'Szerverszoba - Polc C', 'low_stock', 'WiFi 6 kettős sáv, 5.3 Gbps összteljesítmény, PoE táplált'),
(2, 'NET-CAT6-305', 'Cat6 UTP Fali Hálózati Kábel (305m)', 0, 2, 42000.00, 'Kábelraktár - B/4', 'out_of_stock', '100% vörösréz vezető, LSZH lila köpeny, megrendelés folyamatban'),
(3, 'PER-MX-3S', 'Logitech MX Master 3S Vezeték Nélküli Egér', 12, 4, 39900.00, 'Kisalkatrész Polc 01', 'in_stock', 'MagSpeed görgető, 8000 DPI Darkfield szenzor, csendes kattintás'),
(3, 'PER-KEYCH-K2', 'Keychron K2 Pro Vezeték Nélküli Billentyűzet', 6, 2, 46500.00, 'Kisalkatrész Polc 02', 'in_stock', '75% kiosztás, Hot-swap Gateron Red kapcsolók, RGB háttérvilágítás'),
(3, 'PER-DELL-WD19', 'Dell WD19S 130W USB-C Dokkolóállomás', 7, 3, 69000.00, 'Központi Raktár A/3', 'in_stock', '2x DP 1.4, 1x HDMI 2.0b, Gigabit Ethernet, 90W gépellátás'),
(4, 'SW-WIN11-PRO', 'Microsoft Windows 11 Pro OEM Licenc', 22, 5, 48000.00, 'Digitális Kulcstár', 'in_stock', 'Digitális ESD licenckulcsok egyedi eszköz regisztrációhoz'),
(4, 'SW-JETB-ALL', 'JetBrains All Products Pack Éves Licenc', 5, 2, 185000.00, 'Fejlesztői fiók', 'in_stock', 'IntelliJ IDEA, WebStorm, PyCharm, DataGrip, CLion fejlesztői csomag'),
(5, 'OFF-HP-M507', 'HP LaserJet Enterprise M507x Nyomtató', 1, 1, 295000.00, 'Irodatechnikai tároló', 'ordered', '43 lap/perc, automata kétoldalas nyomtatás, 650 lapos tálca');

SET FOREIGN_KEY_CHECKS = 1;
