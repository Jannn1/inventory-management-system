<?php
/**
 * Adatbázis Alapú Nyilvántartó Rendszer (Inventory & Asset Management) REST API
 * Kapcsolati MySQL relációk (PDO), CRUD műveletek, statisztikák, CSV export és demo reset
 */

require_once __DIR__ . '/db.php';

// CORS és biztonsági fejlécek fehérlista alapján
sendCorsAndSecurityHeaders('GET, POST, OPTIONS');

$pdo = getDbConnection();
if (!$pdo) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Adatbázis kapcsolódási hiba.']);
    exit;
}

/**
 * Táblák létrehozása és mintaadatok inicializálása, ha még nem léteznek
 */
function initInventoryTables($pdo) {
    // 1. Kategóriák tábla
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `inventory_categories` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `slug` VARCHAR(50) NOT NULL UNIQUE,
            `color` VARCHAR(30) DEFAULT 'indigo',
            `icon` VARCHAR(30) DEFAULT 'Folder',
            `description` VARCHAR(255) DEFAULT '',
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 2. Termékek / Eszközök tábla
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `inventory_items` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `category_id` INT NOT NULL,
            `sku` VARCHAR(50) NOT NULL UNIQUE,
            `name` VARCHAR(150) NOT NULL,
            `quantity` INT NOT NULL DEFAULT 0,
            `min_quantity` INT NOT NULL DEFAULT 5,
            `unit_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            `location` VARCHAR(100) DEFAULT 'Főraktár',
            `status` VARCHAR(30) NOT NULL DEFAULT 'in_stock',
            `notes` TEXT,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_category (`category_id`),
            INDEX idx_sku (`sku`),
            INDEX idx_status (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Ellenőrizzük, van-e már kategória adat
    $count = $pdo->query("SELECT COUNT(*) FROM `inventory_categories`")->fetchColumn();
    if ($count == 0) {
        seedInventoryDemoData($pdo);
    }
}

/**
 * Mintaadatok feltöltése
 */
function seedInventoryDemoData($pdo) {
    // Táblák ürítése meglévő foreign key-ek ideiglenes kikapcsolásával
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE `inventory_items`;");
    $pdo->exec("TRUNCATE TABLE `inventory_categories`;");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // Kategóriák beszúrása
    $categories = [
        ['name' => 'IT Hardver & Munkaállomások', 'slug' => 'hardware', 'color' => 'emerald', 'icon' => 'Laptop', 'description' => 'Számítógépek, laptopok, monitorok és munkaállomások'],
        ['name' => 'Hálózati Infrastruktúra', 'slug' => 'networking', 'color' => 'cyan', 'icon' => 'Network', 'description' => 'Switchek, routerek, access pointok és rack kábelezés'],
        ['name' => 'Perifériák & Kiegészítők', 'slug' => 'peripherals', 'color' => 'purple', 'icon' => 'Keyboard', 'description' => 'Billentyűzetek, professzionális egerek és dokkolók'],
        ['name' => 'Szoftver Licencek & Felhő', 'slug' => 'software', 'color' => 'indigo', 'icon' => 'FileCode', 'description' => 'Operációs rendszerek, fejlesztői és irodai licencek'],
        ['name' => 'Irodatechnika & Kellékek', 'slug' => 'office', 'color' => 'amber', 'icon' => 'Printer', 'description' => 'Nyomtatók, tonerek, tápegységek és irodai eszközök'],
    ];

    $catStmt = $pdo->prepare("INSERT INTO `inventory_categories` (`name`, `slug`, `color`, `icon`, `description`) VALUES (?, ?, ?, ?, ?)");
    $catMap = [];
    foreach ($categories as $cat) {
        $catStmt->execute([$cat['name'], $cat['slug'], $cat['color'], $cat['icon'], $cat['description']]);
        $catMap[$cat['slug']] = $pdo->lastInsertId();
    }

    // Eszközök és termékek beszúrása
    $items = [
        [
            'category_slug' => 'hardware',
            'sku' => 'HW-DELL-5530',
            'name' => 'Dell Latitude 5530 i7 Laptop',
            'quantity' => 14,
            'min_quantity' => 3,
            'unit_price' => 385000,
            'location' => 'Központi Raktár A/1',
            'status' => 'in_stock',
            'notes' => 'Intel Core i7-1265U, 16GB RAM, 512GB NVMe SSD, Win11 Pro',
        ],
        [
            'category_slug' => 'hardware',
            'sku' => 'HW-LG-27UP',
            'name' => 'LG UltraFine 27" 4K IPS Monitor',
            'quantity' => 8,
            'min_quantity' => 2,
            'unit_price' => 129000,
            'location' => 'Központi Raktár A/2',
            'status' => 'in_stock',
            'notes' => '3840x2160 felbontás, 99% sRGB, USB-C 90W PD töltéssel',
        ],
        [
            'category_slug' => 'hardware',
            'sku' => 'HW-M3-PRO',
            'name' => 'Apple MacBook Pro 14" M3 Pro',
            'quantity' => 2,
            'min_quantity' => 3,
            'unit_price' => 849000,
            'location' => 'Páncélszekrény / VIP',
            'status' => 'low_stock',
            'notes' => '18GB Unified Memory, 512GB SSD, Asztroszürke, tesztelői gép',
        ],
        [
            'category_slug' => 'networking',
            'sku' => 'NET-CIS-2960',
            'name' => 'Cisco Catalyst 2960-X 24p Gigabit Switch',
            'quantity' => 4,
            'min_quantity' => 1,
            'unit_price' => 215000,
            'location' => 'Szerverszoba - Rack 02',
            'status' => 'in_stock',
            'notes' => '24 Port PoE+, 4x 1G SFP uplink, menedzselt L2 réteg',
        ],
        [
            'category_slug' => 'networking',
            'sku' => 'NET-UBI-U6',
            'name' => 'UniFi 6 Pro WiFi Access Point',
            'quantity' => 1,
            'min_quantity' => 2,
            'unit_price' => 68000,
            'location' => 'Szerverszoba - Polc C',
            'status' => 'low_stock',
            'notes' => 'WiFi 6 kettős sáv, 5.3 Gbps összteljesítmény, PoE táplált',
        ],
        [
            'category_slug' => 'networking',
            'sku' => 'NET-CAT6-305',
            'name' => 'Cat6 UTP Fali Hálózati Kábel (305m)',
            'quantity' => 0,
            'min_quantity' => 2,
            'unit_price' => 42000,
            'location' => 'Kábelraktár - B/4',
            'status' => 'out_of_stock',
            'notes' => '100% vörösréz vezető, LSZH lila köpeny, megrendelés folyamatban',
        ],
        [
            'category_slug' => 'peripherals',
            'sku' => 'PER-MX-3S',
            'name' => 'Logitech MX Master 3S Vezeték Nélküli Egér',
            'quantity' => 12,
            'min_quantity' => 4,
            'unit_price' => 39900,
            'location' => 'Kisalkatrész Polc 01',
            'status' => 'in_stock',
            'notes' => 'MagSpeed görgető, 8000 DPI Darkfield szenzor, csendes kattintás',
        ],
        [
            'category_slug' => 'peripherals',
            'sku' => 'PER-KEYCH-K2',
            'name' => 'Keychron K2 Pro Vezeték Nélküli Billentyűzet',
            'quantity' => 6,
            'min_quantity' => 2,
            'unit_price' => 46500,
            'location' => 'Kisalkatrész Polc 02',
            'status' => 'in_stock',
            'notes' => '75% kiosztás, Hot-swap Gateron Red kapcsolók, RGB háttérvilágítás',
        ],
        [
            'category_slug' => 'peripherals',
            'sku' => 'PER-DELL-WD19',
            'name' => 'Dell WD19S 130W USB-C Dokkolóállomás',
            'quantity' => 7,
            'min_quantity' => 3,
            'unit_price' => 69000,
            'location' => 'Központi Raktár A/3',
            'status' => 'in_stock',
            'notes' => '2x DP 1.4, 1x HDMI 2.0b, Gigabit Ethernet, 90W gépellátás',
        ],
        [
            'category_slug' => 'software',
            'sku' => 'SW-WIN11-PRO',
            'name' => 'Microsoft Windows 11 Pro OEM Licenc',
            'quantity' => 22,
            'min_quantity' => 5,
            'unit_price' => 48000,
            'location' => 'Digitális Kulcstár',
            'status' => 'in_stock',
            'notes' => 'Digitális ESD licenckulcsok egyedi eszköz regisztrációhoz',
        ],
        [
            'category_slug' => 'software',
            'sku' => 'SW-JETB-ALL',
            'name' => 'JetBrains All Products Pack Éves Licenc',
            'quantity' => 5,
            'min_quantity' => 2,
            'unit_price' => 185000,
            'location' => 'Fejlesztői fiók',
            'status' => 'in_stock',
            'notes' => 'IntelliJ IDEA, WebStorm, PyCharm, DataGrip, CLion fejlesztői csomag',
        ],
        [
            'category_slug' => 'office',
            'sku' => 'OFF-HP-M507',
            'name' => 'HP LaserJet Enterprise M507x Nyomtató',
            'quantity' => 1,
            'min_quantity' => 1,
            'unit_price' => 295000,
            'location' => 'Irodatechnikai tároló',
            'status' => 'ordered',
            'notes' => '43 lap/perc, automata kétoldalas nyomtatás, 650 lapos tálca',
        ],
    ];

    $itemStmt = $pdo->prepare("
        INSERT INTO `inventory_items` 
        (`category_id`, `sku`, `name`, `quantity`, `min_quantity`, `unit_price`, `location`, `status`, `notes`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    foreach ($items as $item) {
        $catId = $catMap[$item['category_slug']] ?? 1;
        $itemStmt->execute([
            $catId,
            $item['sku'],
            $item['name'],
            $item['quantity'],
            $item['min_quantity'],
            $item['unit_price'],
            $item['location'],
            $item['status'],
            $item['notes'],
        ]);
    }
}

// Táblák inicializálása
initInventoryTables($pdo);

$action = $_GET['action'] ?? 'list';

// ========================================================
// 1. TÉTELEK LISTÁZÁSA (SZŰRÉS & KERESÉS & RENDEZÉS)
// ========================================================
if ($action === 'list') {
    $q = trim($_GET['q'] ?? '');
    $categoryId = isset($_GET['category_id']) && is_numeric($_GET['category_id']) ? (int)$_GET['category_id'] : null;
    $status = trim($_GET['status'] ?? '');
    $sortBy = $_GET['sort_by'] ?? 'name';
    $sortOrder = strtoupper($_GET['sort_order'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';

    $validSorts = [
        'name' => 'i.name',
        'sku' => 'i.sku',
        'quantity' => 'i.quantity',
        'unit_price' => 'i.unit_price',
        'created_at' => 'i.created_at',
        'category' => 'c.name',
    ];
    $sortCol = $validSorts[$sortBy] ?? 'i.name';

    $sql = "
        SELECT 
            i.id,
            i.category_id,
            c.name AS category_name,
            c.slug AS category_slug,
            c.color AS category_color,
            c.icon AS category_icon,
            i.sku,
            i.name,
            i.quantity,
            i.min_quantity,
            i.unit_price,
            (i.quantity * i.unit_price) AS total_value,
            i.location,
            i.status,
            i.notes,
            i.updated_at,
            i.created_at
        FROM `inventory_items` i
        INNER JOIN `inventory_categories` c ON i.category_id = c.id
        WHERE 1=1
    ";

    $params = [];

    if ($q !== '') {
        $sql .= " AND (i.name LIKE ? OR i.sku LIKE ? OR i.location LIKE ? OR i.notes LIKE ?)";
        $searchTerm = "%{$q}%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    if ($categoryId) {
        $sql .= " AND i.category_id = ?";
        $params[] = $categoryId;
    }

    if ($status !== '' && in_array($status, ['in_stock', 'low_stock', 'out_of_stock', 'ordered'])) {
        $sql .= " AND i.status = ?";
        $params[] = $status;
    }

    $sql .= " ORDER BY {$sortCol} {$sortOrder}";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $items = $stmt->fetchAll();

    // Lekérdezzük a kategóriákat is a szűrő dropdownhoz
    $categories = $pdo->query("SELECT * FROM `inventory_categories` ORDER BY `id` ASC")->fetchAll();

    echo json_encode([
        'success' => true,
        'items' => $items,
        'categories' => $categories,
        'count' => count($items),
    ]);
    exit;
}

// ========================================================
// 2. DASHBOARD KPI STATISZTIKÁK
// ========================================================
if ($action === 'stats') {
    // Összesített statisztikák
    $totalQuery = $pdo->query("
        SELECT 
            COUNT(*) AS total_items,
            COALESCE(SUM(quantity), 0) AS total_quantity,
            COALESCE(SUM(quantity * unit_price), 0) AS total_inventory_value,
            COUNT(CASE WHEN quantity <= min_quantity AND quantity > 0 THEN 1 END) AS low_stock_count,
            COUNT(CASE WHEN quantity = 0 THEN 1 END) AS out_of_stock_count,
            COUNT(CASE WHEN status = 'ordered' THEN 1 END) AS ordered_count
        FROM `inventory_items`
    ")->fetch();

    // Kategóriánkénti bontás
    $categoryBreakdown = $pdo->query("
        SELECT 
            c.id,
            c.name,
            c.slug,
            c.color,
            COUNT(i.id) AS item_count,
            COALESCE(SUM(i.quantity), 0) AS total_qty,
            COALESCE(SUM(i.quantity * i.unit_price), 0) AS total_value
        FROM `inventory_categories` c
        LEFT JOIN `inventory_items` i ON c.id = i.category_id
        GROUP BY c.id
        ORDER BY total_value DESC
    ")->fetchAll();

    echo json_encode([
        'success' => true,
        'stats' => [
            'total_items' => (int)$totalQuery['total_items'],
            'total_quantity' => (int)$totalQuery['total_quantity'],
            'total_inventory_value' => (float)$totalQuery['total_inventory_value'],
            'low_stock_count' => (int)$totalQuery['low_stock_count'],
            'out_of_stock_count' => (int)$totalQuery['out_of_stock_count'],
            'ordered_count' => (int)$totalQuery['ordered_count'],
        ],
        'categories' => $categoryBreakdown,
    ]);
    exit;
}

// ========================================================
// 3. ÚJ ESZKÖZ / TÉTEL RÖGZÍTÉSE (CREATE)
// ========================================================
if ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Érvénytelen JSON kérés.']);
        exit;
    }

    $sku = strtoupper(trim($data['sku'] ?? ''));
    $name = trim($data['name'] ?? '');
    $categoryId = (int)($data['category_id'] ?? 1);
    $quantity = max(0, (int)($data['quantity'] ?? 0));
    $minQuantity = max(0, (int)($data['min_quantity'] ?? 3));
    $unitPrice = max(0, (float)($data['unit_price'] ?? 0));
    $location = trim($data['location'] ?? 'Főraktár');
    $notes = trim($data['notes'] ?? '');

    // Automatikus státusz meghatározás vagy egyedi beállítás
    $status = trim($data['status'] ?? '');
    if (!$status || !in_array($status, ['in_stock', 'low_stock', 'out_of_stock', 'ordered'])) {
        if ($quantity === 0) {
            $status = 'out_of_stock';
        } elseif ($quantity <= $minQuantity) {
            $status = 'low_stock';
        } else {
            $status = 'in_stock';
        }
    }

    if (empty($sku) || empty($name)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'A cikkszám (SKU) és a megnevezés megadása kötelező!']);
        exit;
    }

    // Cikkszám egyediség ellenőrzése
    $checkStmt = $pdo->prepare("SELECT `id` FROM `inventory_items` WHERE `sku` = ?");
    $checkStmt->execute([$sku]);
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Ez a cikkszám (SKU) már létezik az adatbázisban!']);
        exit;
    }

    $insertStmt = $pdo->prepare("
        INSERT INTO `inventory_items` 
        (`category_id`, `sku`, `name`, `quantity`, `min_quantity`, `unit_price`, `location`, `status`, `notes`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $insertStmt->execute([
        $categoryId,
        $sku,
        $name,
        $quantity,
        $minQuantity,
        $unitPrice,
        $location,
        $status,
        $notes,
    ]);

    $newId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Új tétel sikeresen rögzítve az adatbázisban!',
        'id' => $newId,
    ]);
    exit;
}

// ========================================================
// 4. MEGLÉVŐ TÉTEL MÓDOSÍTÁSA (UPDATE)
// ========================================================
if ($action === 'update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    $id = (int)($data['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Hiányzó tétel azonosító (ID).']);
        exit;
    }

    $sku = strtoupper(trim($data['sku'] ?? ''));
    $name = trim($data['name'] ?? '');
    $categoryId = (int)($data['category_id'] ?? 1);
    $quantity = max(0, (int)($data['quantity'] ?? 0));
    $minQuantity = max(0, (int)($data['min_quantity'] ?? 3));
    $unitPrice = max(0, (float)($data['unit_price'] ?? 0));
    $location = trim($data['location'] ?? 'Főraktár');
    $notes = trim($data['notes'] ?? '');
    $status = trim($data['status'] ?? '');

    if (empty($sku) || empty($name)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'A cikkszám (SKU) és a megnevezés megadása kötelező!']);
        exit;
    }

    // Cikkszám egyediség ellenőrzése más rekordokhoz képest
    $checkStmt = $pdo->prepare("SELECT `id` FROM `inventory_items` WHERE `sku` = ? AND `id` != ?");
    $checkStmt->execute([$sku, $id]);
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Ez a cikkszám (SKU) már egy másik tételhez tartozik!']);
        exit;
    }

    if (!$status || !in_array($status, ['in_stock', 'low_stock', 'out_of_stock', 'ordered'])) {
        if ($quantity === 0) {
            $status = 'out_of_stock';
        } elseif ($quantity <= $minQuantity) {
            $status = 'low_stock';
        } else {
            $status = 'in_stock';
        }
    }

    $updateStmt = $pdo->prepare("
        UPDATE `inventory_items` SET
            `category_id` = ?,
            `sku` = ?,
            `name` = ?,
            `quantity` = ?,
            `min_quantity` = ?,
            `unit_price` = ?,
            `location` = ?,
            `status` = ?,
            `notes` = ?
        WHERE `id` = ?
    ");
    $updateStmt->execute([
        $categoryId,
        $sku,
        $name,
        $quantity,
        $minQuantity,
        $unitPrice,
        $location,
        $status,
        $notes,
        $id,
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Tétel adatai sikeresen frissítve!',
    ]);
    exit;
}

// ========================================================
// 5. TÉTEL TÖRLÉSE (DELETE)
// ========================================================
if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    $id = (int)($data['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Hiányzó vagy érvénytelen tétel azonosító.']);
        exit;
    }

    $delStmt = $pdo->prepare("DELETE FROM `inventory_items` WHERE `id` = ?");
    $delStmt->execute([$id]);

    echo json_encode([
        'success' => true,
        'message' => 'A tétel sikeresen törölve lett az adatbázisból.',
    ]);
    exit;
}

// ========================================================
// 6. MINTAADATOK VISSZAÁLLÍTÁSA (RESET DEMO)
// ========================================================
if ($action === 'reset_demo' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    seedInventoryDemoData($pdo);
    echo json_encode([
        'success' => true,
        'message' => 'A mintaadatok sikeresen vissza lettek állítva az eredeti állapotra!',
    ]);
    exit;
}

// ========================================================
// 7. CSV EXPORTÁLÁS (LETÖLTHETŐ TÁBLÁZAT UTF-8 BOM-MAL)
// ========================================================
if ($action === 'export_csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="raktar_nyilvantartas_' . date('Y-m-d_H-i') . '.csv"');

    // UTF-8 BOM kiírása, hogy a Microsoft Excel tökéletesen jelenítse meg az ékezetes karaktereket
    echo "\xEF\xBB\xBF";

    $output = fopen('php://output', 'w');

    // Fejléc sor
    fputcsv($output, [
        'Azonosító',
        'Cikkszám (SKU)',
        'Megnevezés',
        'Kategória',
        'Készlet (db)',
        'Min. Készlet (db)',
        'Egységár (Ft)',
        'Összérték (Ft)',
        'Raktárhely',
        'Státusz',
        'Megjegyzés',
        'Módosítva',
    ], ';');

    $stmt = $pdo->query("
        SELECT 
            i.id,
            i.sku,
            i.name,
            c.name AS category_name,
            i.quantity,
            i.min_quantity,
            i.unit_price,
            (i.quantity * i.unit_price) AS total_value,
            i.location,
            CASE 
                WHEN i.status = 'in_stock' THEN 'Raktáron'
                WHEN i.status = 'low_stock' THEN 'Kifogyóban'
                WHEN i.status = 'out_of_stock' THEN 'Kifogyott'
                WHEN i.status = 'ordered' THEN 'Rendelés alatt'
                ELSE i.status
            END AS status_hu,
            i.notes,
            i.updated_at
        FROM `inventory_items` i
        INNER JOIN `inventory_categories` c ON i.category_id = c.id
        ORDER BY c.name ASC, i.name ASC
    ");

    while ($row = $stmt->fetch()) {
        fputcsv($output, [
            $row['id'],
            $row['sku'],
            $row['name'],
            $row['category_name'],
            $row['quantity'],
            $row['min_quantity'],
            number_format($row['unit_price'], 0, ',', ' '),
            number_format($row['total_value'], 0, ',', ' '),
            $row['location'],
            $row['status_hu'],
            $row['notes'],
            $row['updated_at'],
        ], ';');
    }

    fclose($output);
    exit;
}

// ========================================================
// 8. GYORS KÉSZLETMÓDOSÍTÁS (+ / - QUICK ADJUST)
// ========================================================
if ($action === 'adjust_stock' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    $id = (int)($data['id'] ?? 0);
    $delta = (int)($data['delta'] ?? 0);

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Érvénytelen tétel azonosító.']);
        exit;
    }

    $itemStmt = $pdo->prepare("SELECT `quantity`, `min_quantity`, `status` FROM `inventory_items` WHERE `id` = ?");
    $itemStmt->execute([$id]);
    $item = $itemStmt->fetch();

    if (!$item) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'A tétel nem található.']);
        exit;
    }

    $newQty = max(0, (int)$item['quantity'] + $delta);
    $minQty = (int)$item['min_quantity'];

    // Státusz automatikus korrekciója a készlet alapján
    $newStatus = $item['status'];
    if ($newQty === 0) {
        $newStatus = 'out_of_stock';
    } elseif ($newQty <= $minQty) {
        $newStatus = 'low_stock';
    } else {
        $newStatus = 'in_stock';
    }

    $upStmt = $pdo->prepare("UPDATE `inventory_items` SET `quantity` = ?, `status` = ? WHERE `id` = ?");
    $upStmt->execute([$newQty, $newStatus, $id]);

    echo json_encode([
        'success' => true,
        'id' => $id,
        'quantity' => $newQty,
        'status' => $newStatus,
        'message' => 'Készlet sikeresen módosítva!',
    ]);
    exit;
}

// ========================================================
// 9. ÚJ KATEGÓRIA LÉTREHOZÁSA (CREATE CATEGORY)
// ========================================================
if ($action === 'create_category' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    $name = trim($data['name'] ?? '');
    $color = trim($data['color'] ?? 'indigo');
    $icon = trim($data['icon'] ?? 'Folder');
    $description = trim($data['description'] ?? '');

    if (empty($name)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'A kategória nevének megadása kötelező!']);
        exit;
    }

    // Slug generálása
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'));
    if (empty($slug)) {
        $slug = 'cat-' . time();
    }

    // Slug egyediség biztosítása
    $check = $pdo->prepare("SELECT `id` FROM `inventory_categories` WHERE `slug` = ?");
    $check->execute([$slug]);
    if ($check->fetch()) {
        $slug .= '-' . time();
    }

    $stmt = $pdo->prepare("INSERT INTO `inventory_categories` (`name`, `slug`, `color`, `icon`, `description`) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$name, $slug, $color, $icon, $description]);
    $catId = $pdo->lastInsertId();

    $allCats = $pdo->query("SELECT * FROM `inventory_categories` ORDER BY `id` ASC")->fetchAll();

    echo json_encode([
        'success' => true,
        'id' => $catId,
        'categories' => $allCats,
        'message' => 'Új kategória sikeresen létrehozva!',
    ]);
    exit;
}

// ========================================================
// 10. KATEGÓRIA MÓDOSÍTÁSA (UPDATE CATEGORY)
// ========================================================
if ($action === 'update_category' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    $id = (int)($data['id'] ?? 0);
    $name = trim($data['name'] ?? '');
    $color = trim($data['color'] ?? 'indigo');
    $icon = trim($data['icon'] ?? 'Folder');
    $description = trim($data['description'] ?? '');

    if ($id <= 0 || empty($name)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'A kategória azonosító és név megadása kötelező!']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE `inventory_categories` SET `name` = ?, `color` = ?, `icon` = ?, `description` = ? WHERE `id` = ?");
    $stmt->execute([$name, $color, $icon, $description, $id]);

    $allCats = $pdo->query("SELECT * FROM `inventory_categories` ORDER BY `id` ASC")->fetchAll();

    echo json_encode([
        'success' => true,
        'categories' => $allCats,
        'message' => 'Kategória sikeresen frissítve!',
    ]);
    exit;
}

// ========================================================
// 11. KATEGÓRIA TÖRLÉSE (DELETE CATEGORY)
// ========================================================
if ($action === 'delete_category' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    $id = (int)($data['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Érvénytelen kategória azonosító.']);
        exit;
    }

    // Ellenőrizzük, van-e tétel hozzárendelve
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM `inventory_items` WHERE `category_id` = ?");
    $countStmt->execute([$id]);
    $itemCount = (int)$countStmt->fetchColumn();

    if ($itemCount > 0) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => "A kategória nem törölhető, mert még {$itemCount} db tétel tartozik hozzá! Előbb helyezd át vagy töröld a tételeket.",
        ]);
        exit;
    }

    $delStmt = $pdo->prepare("DELETE FROM `inventory_categories` WHERE `id` = ?");
    $delStmt->execute([$id]);

    $allCats = $pdo->query("SELECT * FROM `inventory_categories` ORDER BY `id` ASC")->fetchAll();

    echo json_encode([
        'success' => true,
        'categories' => $allCats,
        'message' => 'A kategória sikeresen törölve lett!',
    ]);
    exit;
}

// Ismeretlen művelet
http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Ismeretlen művelet (action).']);
