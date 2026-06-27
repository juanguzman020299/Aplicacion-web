<?php

declare(strict_types=1);

session_start();
require_once dirname(__DIR__) . '/config/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function responder(array $datos, int $codigo = 200): never
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function leerJson(): array
{
    $contenido = file_get_contents('php://input');
    $datos = json_decode($contenido ?: '{}', true);

    if (!is_array($datos)) {
        responder(['mensaje' => 'El cuerpo de la solicitud no contiene un JSON válido.'], 400);
    }

    return $datos;
}

function limpiar(?string $valor): string
{
    return trim((string) $valor);
}

function validarDatos(array $datos, bool $esEdicion = false): array
{
    $campos = ['nombre', 'correo', 'telefono', 'usuario', 'rol'];
    foreach ($campos as $campo) {
        if (limpiar($datos[$campo] ?? '') === '') {
            responder(['mensaje' => "El campo {$campo} es obligatorio."], 422);
        }
    }

    $correo = limpiar($datos['correo'] ?? '');
    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        responder(['mensaje' => 'El correo electrónico no tiene un formato válido.'], 422);
    }

    $telefono = limpiar($datos['telefono'] ?? '');
    if (!preg_match('/^(809|829|849)-?\d{3}-?\d{4}$/', $telefono)) {
        responder(['mensaje' => 'Ingrese un teléfono dominicano válido.'], 422);
    }

    $rolesPermitidos = ['estudiante', 'administrador', 'invitado'];
    if (!in_array($datos['rol'], $rolesPermitidos, true)) {
        responder(['mensaje' => 'El rol seleccionado no es válido.'], 422);
    }

    $password = (string) ($datos['password'] ?? '');
    if (!$esEdicion && strlen($password) < 6) {
        responder(['mensaje' => 'La contraseña debe tener al menos 6 caracteres.'], 422);
    }

    if ($esEdicion && $password !== '' && strlen($password) < 6) {
        responder(['mensaje' => 'La nueva contraseña debe tener al menos 6 caracteres.'], 422);
    }

    return [
        'nombre' => limpiar($datos['nombre'] ?? ''),
        'correo' => strtolower($correo),
        'telefono' => $telefono,
        'usuario' => limpiar($datos['usuario'] ?? ''),
        'password' => $password,
        'rol' => limpiar($datos['rol'] ?? ''),
        'comentario' => limpiar($datos['comentario'] ?? '')
    ];
}

try {
    $pdo = obtenerConexion();
    $metodo = $_SERVER['REQUEST_METHOD'];
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

    if ($metodo === 'GET') {
        if ($id) {
            $consulta = $pdo->prepare(
                'SELECT id, nombre, correo, telefono, usuario, rol, comentario, creado_en, actualizado_en
                 FROM usuarios WHERE id = :id'
            );
            $consulta->execute(['id' => $id]);
            $usuario = $consulta->fetch();

            if (!$usuario) {
                responder(['mensaje' => 'Usuario no encontrado.'], 404);
            }

            responder(['usuario' => $usuario]);
        }

        $consulta = $pdo->query(
            'SELECT id, nombre, correo, telefono, usuario, rol, comentario, creado_en, actualizado_en
             FROM usuarios ORDER BY id DESC'
        );
        responder(['usuarios' => $consulta->fetchAll()]);
    }

    if ($metodo === 'POST') {
        $datos = validarDatos(leerJson());
        $consulta = $pdo->prepare(
            'INSERT INTO usuarios (nombre, correo, telefono, usuario, password_hash, rol, comentario)
             VALUES (:nombre, :correo, :telefono, :usuario, :password_hash, :rol, :comentario)'
        );
        $consulta->execute([
            'nombre' => $datos['nombre'],
            'correo' => $datos['correo'],
            'telefono' => $datos['telefono'],
            'usuario' => $datos['usuario'],
            'password_hash' => password_hash($datos['password'], PASSWORD_DEFAULT),
            'rol' => $datos['rol'],
            'comentario' => $datos['comentario']
        ]);

        $nuevoId = (int) $pdo->lastInsertId();
        $_SESSION['ultimo_usuario_id'] = $nuevoId;
        responder(['mensaje' => 'Usuario creado correctamente.', 'id' => $nuevoId], 201);
    }

    if ($metodo === 'PUT') {
        if (!$id) {
            responder(['mensaje' => 'Debe indicar el ID del usuario que desea actualizar.'], 400);
        }

        $datos = validarDatos(leerJson(), true);
        $verificar = $pdo->prepare('SELECT id FROM usuarios WHERE id = :id');
        $verificar->execute(['id' => $id]);
        if (!$verificar->fetch()) {
            responder(['mensaje' => 'Usuario no encontrado.'], 404);
        }

        if ($datos['password'] !== '') {
            $consulta = $pdo->prepare(
                'UPDATE usuarios
                 SET nombre = :nombre, correo = :correo, telefono = :telefono, usuario = :usuario,
                     password_hash = :password_hash, rol = :rol, comentario = :comentario,
                     actualizado_en = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $parametros = [
                'nombre' => $datos['nombre'], 'correo' => $datos['correo'],
                'telefono' => $datos['telefono'], 'usuario' => $datos['usuario'],
                'password_hash' => password_hash($datos['password'], PASSWORD_DEFAULT),
                'rol' => $datos['rol'], 'comentario' => $datos['comentario'], 'id' => $id
            ];
        } else {
            $consulta = $pdo->prepare(
                'UPDATE usuarios
                 SET nombre = :nombre, correo = :correo, telefono = :telefono, usuario = :usuario,
                     rol = :rol, comentario = :comentario, actualizado_en = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $parametros = [
                'nombre' => $datos['nombre'], 'correo' => $datos['correo'],
                'telefono' => $datos['telefono'], 'usuario' => $datos['usuario'],
                'rol' => $datos['rol'], 'comentario' => $datos['comentario'], 'id' => $id
            ];
        }

        $consulta->execute($parametros);
        responder(['mensaje' => 'Usuario actualizado correctamente.']);
    }

    if ($metodo === 'DELETE') {
        if (isset($_GET['all']) && $_GET['all'] === '1') {
            $pdo->exec('DELETE FROM usuarios');
            $pdo->exec("DELETE FROM sqlite_sequence WHERE name = 'usuarios'");
            responder(['mensaje' => 'Todos los usuarios fueron eliminados.']);
        }

        if (!$id) {
            responder(['mensaje' => 'Debe indicar el ID del usuario que desea eliminar.'], 400);
        }

        $consulta = $pdo->prepare('DELETE FROM usuarios WHERE id = :id');
        $consulta->execute(['id' => $id]);

        if ($consulta->rowCount() === 0) {
            responder(['mensaje' => 'Usuario no encontrado.'], 404);
        }

        responder(['mensaje' => 'Usuario eliminado correctamente.']);
    }

    responder(['mensaje' => 'Método HTTP no permitido.'], 405);
} catch (PDOException $error) {
    $mensaje = str_contains($error->getMessage(), 'UNIQUE constraint failed')
        ? 'El correo o el nombre de usuario ya está registrado.'
        : 'Ocurrió un error al consultar la base de datos.';
    responder(['mensaje' => $mensaje], str_contains($error->getMessage(), 'UNIQUE') ? 409 : 500);
} catch (Throwable $error) {
    responder(['mensaje' => 'Ocurrió un error interno en el servidor.'], 500);
}
