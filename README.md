# Ferrama


FerraMas
Este es el repositorio principal para el proyecto FerraMas, una aplicación de comercio electrónico que consta de un backend (API) y un frontend (interfaz de usuario).

Estructura del Proyecto
El proyecto está organizado en dos directorios principales:

backend/: Contiene la lógica del servidor, la API RESTful, la integración con la base de datos (PostgreSQL) y la pasarela de pagos (Transbank Webpay Plus).
frontend/: Contiene la aplicación web de cliente construida con React (Vite).
Tecnologías Utilizadas
Backend
Node.js / Express.js: Framework para construir la API.
PostgreSQL: Base de datos relacional para almacenar información de productos, sucursales, transacciones, etc.
transbank-sdk: SDK oficial para la integración con Webpay Plus.
pg: Cliente de PostgreSQL para Node.js.
dotenv: Para la gestión de variables de entorno.
cors: Para manejar las políticas de Cross-Origin Resource Sharing.
Frontend
React (Vite): Biblioteca para construir la interfaz de usuario.
Tailwind CSS: Framework CSS para estilos rápidos y responsivos.
Axios: Cliente HTTP para realizar peticiones a la API del backend.
React Router DOM: Para la navegación entre páginas.
React Hot Toast: Para notificaciones de usuario.
Configuración y Ejecución Local
Para poner en marcha el proyecto en tu máquina local, sigue estos pasos:

1. Requisitos Previos
Asegúrate de tener instalado lo siguiente:

Node.js (versión 14 o superior recomendada)
npm (viene con Node.js) o Yarn
PostgreSQL: Servidor de base de datos en ejecución.
Credenciales de Transbank Webpay Plus: Comercio de integración (TNK).
2. Configuración de la Base de Datos (PostgreSQL)
Crea una base de datos para el proyecto (por ejemplo, ferramas).
SQL

CREATE DATABASE ferramas;
Ejecuta las migraciones o scripts SQL para crear las tablas necesarias (por ejemplo, transacciones_webpay, stock_sucursales, productos, sucursales). Asegúrate de que las tablas public.transacciones_webpay y public.stock_sucursales existen con las columnas adecuadas.
3. Configuración del Backend
Navega a la carpeta backend:

Bash

cd backend
Instala las dependencias:

Bash

npm install
# o
yarn install
Crea un archivo .env en la raíz de la carpeta backend y añade tus variables de entorno:

Fragmento de código

DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario_pg
DB_PASSWORD=tu_password_pg
DB_NAME=ferramas
PORT=3000
# Credenciales de Transbank Webpay Plus (Integración)
WEBPAY_PLUS_COMMERCE_CODE=597055555532
WEBPAY_PLUS_API_KEY=597055555532
Importante: WEBPAY_PLUS_COMMERCE_CODE y WEBPAY_PLUS_API_KEY son los valores de integración de Transbank. Mantén siempre tus claves API seguras y no las subas a repositorios públicos.

Inicia el servidor backend:

Bash

npm start
# o
node server.js
El backend debería iniciar en http://localhost:3000.

4. Configuración del Frontend
Navega a la carpeta frontend:
Bash

cd ../frontend
Instala las dependencias:
Bash

npm install
# o
yarn install
Inicia la aplicación frontend:
Bash

npm run dev
# o
yarn dev
La aplicación frontend debería abrirse en tu navegador (normalmente en http://localhost:5173).
Funcionamiento
El Frontend interactúa con el usuario para seleccionar productos y cantidades.
Al proceder al pago, el frontend llama al endpoint /api/webpay/crear del Backend.
El backend utiliza el SDK de Transbank para crear una transacción Webpay Plus y guarda el token en la base de datos.
El frontend redirige al usuario a la página de pago de Transbank.
Una vez el usuario completa el pago en Transbank, es redirigido de vuelta al frontend (http://localhost:5173/pago-finalizado).
El frontend extrae el token_ws de la URL y lo envía al endpoint /api/webpay/confirmar del Backend.
El backend confirma la transacción con Transbank, actualiza el estado en la base de datos y descuenta el stock del producto en la sucursal correspondiente. La lógica de idempotencia asegura que las confirmaciones duplicadas no procesen la misma transacción dos veces.
El frontend muestra el estado final del pago (exitoso, rechazado, en proceso o error) al usuario.
Contribuciones
Si deseas contribuir a este proyecto, por favor, sigue el flujo estándar de Git:

Haz un "fork" del repositorio.
Crea una nueva rama (git checkout -b feature/nueva-funcionalidad).
Realiza tus cambios y haz "commits" descriptivos.
Envía tus cambios (git push origin feature/nueva-funcionalidad).
Abre un "Pull Request".
