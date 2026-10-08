<?php
/**
 * Adatbázis konfiguráció és PDO kapcsolat (MySQL)
 * Inventory & Asset Management System
 */

require_once __DIR__ . '/security.php';

// ========================================================
// ADATBÁZIS BEÁLLÍTÁSOK BIZTONSÁGOS BETÖLTÉSE
// ========================================================
$secretConfigFile = __DIR__ . '/db_config.php';
if (file_exists($secretConfigFile)) {
    $dbConfig = require $secretConfigFile;
} else {
    // Alapértelmezett / Környezeti változók (pl. Docker / GitHub környezet)
    $dbConfig = [
        'host' => getenv('DB_HOST') ?: 'localhost',
        'name' => getenv('DB_NAME') ?: 'inventory_db',
        'user' => getenv('DB_USER') ?: 'root',
        'pass' => getenv('DB_PASS') ?: '',
    ];
}

$db_host = $dbConfig['host'] ?? 'localhost';
$db_name = $dbConfig['name'] ?? 'inventory_db';
$db_user = $dbConfig['user'] ?? 'root';
$db_pass = $dbConfig['pass'] ?? '';

/**
 * Adatbázis kapcsolat létrehozása PDO-val (MySQL)
 */
function getDbConnection() {
    global $db_host, $db_name, $db_user, $db_pass;

    try {
        $dsn = "mysql:host={$db_host};dbname={$db_name};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        
        $pdo = new PDO($dsn, $db_user, $db_pass, $options);
        return $pdo;
    } catch (PDOException $e) {
        error_log("DB Connection Error: " . $e->getMessage());
        return null;
    }
}
