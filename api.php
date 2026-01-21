<?php
/**
 * api.php - Backend Centralizado AccessInsight
 * Desenvolvido para Hostinger MySQL
 */

// 1. Configurações de Erro (Desative em produção se desejar, mas mantenha agora para debugar)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Não imprimir erros diretamente para não quebrar o JSON

// 2. Headers CORS e JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// 3. Credenciais fornecidas
$db_host = "localhost";
$db_name = "u631227285_userManager";
$db_user = "u631227285_userManager";
$db_pass = "I|YSLaB81b";
$global_id = "global_system_data";

try {
    // Conexão com timeout curto para não travar o servidor
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ];
    
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, $options);

    // 4. Criação da Tabela (Se falhar, o erro será capturado no catch)
    $sql_table = "CREATE TABLE IF NOT EXISTS access_insight_workspaces (
        workspace_id VARCHAR(100) PRIMARY KEY,
        data_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql_table);

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        $input_raw = file_get_contents('php://input');
        $input = json_decode($input_raw, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("JSON inválido recebido no POST");
        }

        $stmt = $pdo->prepare("INSERT INTO access_insight_workspaces (workspace_id, data_json) 
                               VALUES (?, ?) 
                               ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()");
        
        $json_to_save = json_encode($input);
        $stmt->execute([$global_id, $json_to_save]);
        
        echo json_encode(["success" => true, "message" => "Dados salvos com sucesso"]);
    } 
    elseif ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT data_json FROM access_insight_workspaces WHERE workspace_id = ?");
        $stmt->execute([$global_id]);
        $result = $stmt->fetch();

        if ($result && !empty($result['data_json'])) {
            // Retornamos os dados decodificados para garantir que o JSON final seja limpo
            $data = json_decode($result['data_json'], true);
            echo json_encode($data);
        } else {
            // Retorno padrão para banco vazio
            echo json_encode(["users" => [], "systems" => []]);
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Erro no Banco de Dados",
        "details" => $e->getMessage(),
        "code" => $e->getCode()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Erro Geral",
        "details" => $e->getMessage()
    ]);
}
?>