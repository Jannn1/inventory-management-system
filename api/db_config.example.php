<?php
/**
 * Minta Adatbázis Konfiguráció (db_config.example.php)
 * 
 * HASZNÁLAT:
 * 1. Másold le ezt a fájlt 'db_config.php' néven!
 * 2. Töltsd ki a saját MySQL adatbázisod kapcsolati adataival!
 * 3. A 'db_config.php' a .gitignore miatt sosem kerül fel a Git tárolóba.
 */
return [
    'host' => 'localhost',
    'name' => 'inventory_db',
    'user' => 'your_database_user',
    'pass' => 'your_database_password',
];
