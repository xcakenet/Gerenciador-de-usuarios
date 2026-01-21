<?php
// api.php - Backend Centralizado para MySQL na Hostinger
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Credenciais fixas fornecidas pelo usuário
$db_host = "localhost";
$db_name = "u631227285_userManager";
$db_user = "u631227285_userManager";
$db_pass = "I|YSLaB81b";
$global_id = "global_system_data"; // ID Único para todos os usuários

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Garante que a tabela existe
    $pdo->exec("CREATE TABLE IF NOT EXISTS access_insight_workspaces (
        workspace_id VARCHAR(100) PRIMARY KEY,
        data_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'OPTIONS') exit;

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) throw new Exception("Dados inválidos");

        $stmt = $pdo->prepare("INSERT INTO access_insight_workspaces (workspace_id, data_json) 
                               VALUES (?, ?) 
                               ON DUPLICATE KEY UPDATE data_json = ?, updated_at = NOW()");
        $json_data = json_encode($input);
        $stmt->execute([$global_id, $json_data, $json_data]);
        
        echo json_encode(["success" => true]);
    } 
    elseif ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT data_json FROM access_insight_workspaces WHERE workspace_id = ?");
        $stmt->execute([$global_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result) {
            echo $result['data_json'];
        } else {
            // Se não houver dados, retorna estrutura vazia em vez de 404 para evitar erros no front
            echo json_encode(["users" => [], "systems" => []]);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>