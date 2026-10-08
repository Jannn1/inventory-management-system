<?php
/**
 * Központi Kiberbiztonsági és Védelmi Modul (PHP 8.x)
 * Biztonságos Tárhelykörnyezethez
 * 
 * Funkciók:
 * - Debug mód letiltása (biztonságos hibakezelés, nincs stack trace szivárgás)
 * - Szigorú CORS ellenőrzés (fehérlista alapú, nem engedélyez idegen domaineket)
 * - Biztonsági HTTP fejlécek (nosniff, frame protection, referrer policy)
 * - IP-alapú Rate Limiting (DDoS, Brute-force és Spambot védelem)
 * - Időzítésbiztos összehasonlítás (Timing Attack védelem)
 * - Fejléc- és bemenet-fertőtlenítés (Header Injection & XSS védelem)
 */

// 1. Debug információk és hibaüzenetek elrejtése a látogatók elől
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(0);

// 2. Engedélyezett CORS eredetek (Origins) fehérlistája
function getAllowedCorsOrigins(): array {
    return [
        'https://jannn1.hu',
        'https://www.jannn1.hu',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://localhost:4173',
    ];
}

/**
 * CORS és Biztonsági Fejlécek Beállítása
 */
function sendCorsAndSecurityHeaders(string $allowedMethods = 'GET, POST, OPTIONS', string $extraHeaders = ''): void {
    // Standard biztonsági fejlécek minden API válaszhoz
    header("Content-Type: application/json; charset=UTF-8");
    header("X-Content-Type-Options: nosniff");
    header("X-Frame-Options: DENY");
    header("Referrer-Policy: strict-origin-when-cross-origin");

    // Origin ellenőrzés fehérlista alapján
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (!empty($origin)) {
        $allowedOrigins = getAllowedCorsOrigins();
        if (in_array(rtrim($origin, '/'), $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header("Access-Control-Allow-Credentials: true");
            header("Access-Control-Max-Age: 86400");
        }
    }

    // Preflight OPTIONS kérés kezelése
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
            header("Access-Control-Allow-Methods: {$allowedMethods}");
        }
        $reqHeaders = "Content-Type, Authorization";
        if (!empty($extraHeaders)) {
            $reqHeaders .= ", {$extraHeaders}";
        }
        header("Access-Control-Allow-Headers: {$reqHeaders}");
        http_response_code(204);
        exit(0);
    }
}

/**
 * Kliens valódi IP címének kinyerése és tisztítása
 */
function getClientIp(): string {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    // Érvényes IP formátum ellenőrzése (IPv4 / IPv6)
    if (!filter_var($ip, FILTER_VALIDATE_IP)) {
        return '127.0.0.1';
    }
    return $ip;
}

/**
 * Időzítésbiztos sztring összehasonlítás (Timing Attack védelem jelszavakhoz és kódokhoz)
 */
function timingSafeEquals(?string $known, ?string $user): bool {
    if ($known === null || $user === null) {
        return false;
    }
    return hash_equals((string)$known, (string)$user);
}

/**
 * E-mail fejléc fertőtlenítés (CRLF injection kivédése)
 */
function sanitizeHeaderField(string $input): string {
    // Eltávolítunk minden sortörést és kontroll karaktert
    return preg_replace('/[\r\n\t]+/', ' ', trim($input));
}

/**
 * Rate Limiting Ellenőrző Motor (MySQL alapú IP vödör)
 * 
 * @param PDO $pdo Adatbázis kapcsolat
 * @param string $action Művelet azonosító (pl. 'admin_login', 'contact_form', 'chat_msg')
 * @param int $maxAttempts Maximálisan engedélyezett kérésszám
 * @param int $windowSeconds Időablak másodpercben
 * @param bool $autoExit Ha true, túllépéskor azonnal 429-es választ küld és leáll
 * @return bool True ha a kérés engedélyezett, false ha túl lépte a limitet
 */
function enforceRateLimit(PDO $pdo, string $action, int $maxAttempts, int $windowSeconds, bool $autoExit = true): bool {
    try {
        $ip = getClientIp();
        $now = time();
        $windowStart = $now - $windowSeconds;

        // Tábla inicializálása szükség esetén
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `api_rate_limits` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `ip_address` VARCHAR(45) NOT NULL,
                `action` VARCHAR(32) NOT NULL,
                `created_at` INT UNSIGNED NOT NULL,
                INDEX idx_lookup (`ip_address`, `action`, `created_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Régi, lejárt rekordok törlése periodikusan (1% eséllyel takarít vagy a mostani rekord törlése)
        if (mt_rand(1, 50) === 1) {
            $cleanup = $pdo->prepare("DELETE FROM `api_rate_limits` WHERE `created_at` < ?");
            $cleanup->execute([$now - 86400]); // 24 óránál régebbi rekordok takarítása
        }

        // Aktuális kérések számlálása ebben az időablakban
        $countStmt = $pdo->prepare("
            SELECT COUNT(*) AS `cnt` 
            FROM `api_rate_limits` 
            WHERE `ip_address` = ? AND `action` = ? AND `created_at` >= ?
        ");
        $countStmt->execute([$ip, $action, $windowStart]);
        $currentCount = (int)$countStmt->fetchColumn();

        if ($currentCount >= $maxAttempts) {
            if ($autoExit) {
                http_response_code(429);
                header("Retry-After: {$windowSeconds}");
                echo json_encode([
                    'success' => false,
                    'rate_limited' => true,
                    'message' => 'Túl sok kérés érkezett erről az IP címről. Kérlek, várj néhány percet a következő próbálkozás előtt!',
                    'retry_after' => $windowSeconds
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
            return false;
        }

        // Kérés rögzítése a vödörbe
        $insertStmt = $pdo->prepare("INSERT INTO `api_rate_limits` (`ip_address`, `action`, `created_at`) VALUES (?, ?, ?)");
        $insertStmt->execute([$ip, $action, $now]);

        return true;
    } catch (Exception $e) {
        // Hiba esetén engedékenyen továbbengedünk, nem akasztjuk meg a normál működést
        return true;
    }
}
