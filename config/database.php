<?php

declare(strict_types=1);

function obtenerConexion(): PDO
{
    $directorio = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'database';

    if (!is_dir($directorio) && !mkdir($directorio, 0775, true) && !is_dir($directorio)) {
        throw new RuntimeException('No fue posible crear el directorio de la base de datos.');
    }

    $rutaBaseDatos = $directorio . DIRECTORY_SEPARATOR . 'proyecto.sqlite';
    $pdo = new PDO('sqlite:' . $rutaBaseDatos);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON');

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            correo TEXT NOT NULL UNIQUE,
            telefono TEXT NOT NULL,
            usuario TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            rol TEXT NOT NULL CHECK (rol IN ("estudiante", "administrador", "invitado")),
            comentario TEXT,
            creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )'
    );

    return $pdo;
}
