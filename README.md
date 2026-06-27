# Proyecto Integrador – Etapa 3: Backend y Persistencia de Datos

## Participantes
Dariel Medina Ynfante Líder
Héctor Antonio Ovalles Alonzo
Junior Alejandro Gómez Ruiz
Rafael David Sánchez Arias
Rafael Alejandro Grullón Germán
Nicole Cepeda Acosta 

## Descripción
Esta versión conecta el frontend de la Etapa 2 con un servidor desarrollado en PHP. Los usuarios se guardan de forma permanente en una base de datos SQLite mediante una API REST.

## Tecnologías utilizadas
- HTML5
- CSS3
- JavaScript
- PHP 8 o superior
- SQLite mediante PDO
- API REST

## Funciones implementadas
- Crear usuarios.
- Consultar todos los usuarios.
- Actualizar usuarios.
- Eliminar un usuario.
- Eliminar todos los usuarios.
- Validación de correo, teléfono dominicano, roles y contraseña.
- Control de registros duplicados.
- Contraseñas protegidas con `password_hash`.
- Sesión PHP para registrar el último usuario creado.

## Estructura principal
```text
api/usuarios.php          API con operaciones CRUD
config/database.php       Conexión y creación automática de SQLite
database/database.sql     Script de exportación de la base de datos
js/app.js                 Integración del frontend con la API
registro.html             Formulario y tabla de usuarios
```

## Instalación con XAMPP en Windows
1. Instale XAMPP y confirme que PHP tenga habilitadas las extensiones `pdo_sqlite` y `sqlite3`.
2. Copie la carpeta del proyecto dentro de:
   `C:\xampp\htdocs\etapa-3-backend`
3. Abra el panel de XAMPP e inicie **Apache**.
4. En el navegador, entre a:
   `http://localhost/etapa-3-backend/`
5. Abra la página **Registro** y guarde un usuario.

La base de datos `database/proyecto.sqlite` se crea automáticamente al utilizar la aplicación por primera vez.

> No abra el proyecto dando doble clic sobre `index.html`, porque la API PHP necesita ejecutarse desde Apache.

## Endpoints de la API
| Método | Ruta | Función |
|---|---|---|
| GET | `api/usuarios.php` | Consultar todos los usuarios |
| GET | `api/usuarios.php?id=1` | Consultar un usuario |
| POST | `api/usuarios.php` | Crear usuario |
| PUT | `api/usuarios.php?id=1` | Actualizar usuario |
| DELETE | `api/usuarios.php?id=1` | Eliminar usuario |
| DELETE | `api/usuarios.php?all=1` | Eliminar todos los usuarios |

## Rama solicitada
```bash
git checkout main
git pull origin main
git checkout -b etapa-3/backend
```

Luego de subir los cambios:
```bash
git add .
git commit -m "Configurar servidor PHP y base de datos SQLite"
git push -u origin etapa-3/backend
```

Finalmente, se debe crear el **Pull Request o Merge Request** desde `etapa-3/backend` hacia `main`.
