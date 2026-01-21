<?php
/**
 * api.php - Versão Minimalista para Compatibilidade Máxima
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$db_host = "localhost";
$db_name = "u631227285_userManager";
$db_user = "u631227285_userManager";
$db_pass = "I|YSLaB81b";
$global_id = "global_system_data";

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Criação silenciosa da tabela
    $pdo->exec("CREATE TABLE IF NOT EXISTS access_insight_workspaces (
        workspace_id VARCHAR(100) PRIMARY KEY,
        data_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $json = file_get_contents('php://input');
        if (empty($json)) throw new Exception("Payload vazio");

        $stmt = $pdo->prepare("REPLACE INTO access_insight_workspaces (workspace_id, data_json) VALUES (?, ?)");
        $stmt->execute([$global_id, $json]);
        echo json_encode(["success" => true]);
    } else {
        $stmt = $pdo->prepare("SELECT data_json FROM access_insight_workspaces WHERE workspace_id = ?");
        $stmt->execute([$global_id]);
        $row = $stmt->fetch();
        echo $row ? $row['data_json'] : json_encode(["users" => [], "systems" => []]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>