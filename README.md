# 🏡 Guamal (Villa MCJ) - Backend API

[![Fastify](https://img.shields.io/badge/Fastify-5.12-black?logo=fastify)](https://fastify.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?logo=zod)](https://zod.dev/)
[![Sequelize](https://img.shields.io/badge/Sequelize--TypeScript-6.37-52B0E7?logo=sequelize)](https://sequelize.org/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?logo=swagger)](https://swagger.io/)

API RESTful de alto rendimiento en **TypeScript y Fastify 5** para la gestión integral de condominios, conjuntos residenciales y urbanizaciones privadas (**Villa MCJ / Guamal**).

---

## 🚀 Módulos y Funcionalidades

* **🔐 Autenticación & Control de Acceso (RBAC):** JWT Bearer tokens con roles para Residentes, Vigilancia y Administradores.
* **🏠 Gestión de Propiedades:** Control de inmuebles, propietarios, arrendatarios y residentes.
* **🎟️ Control de Invitados & Visitas:** Registro previo y autorización de accesos peatonales y vehiculares.
* **📦 Paquetería & Encomiendas:** Notificación y seguimiento de paquetes en portería.
* **💳 Pagos & Facturación:** Registro de cuotas de administración y comprobantes de pago.
* **📅 Reservas de Áreas Comunes:** Agenda para quiosco, piscina, salón social y zonas BBQ.
* **📬 PQRS & Consultas:** Canal directo de peticiones, quejas y reclamos con la administración.
* **📖 Documentación Swagger UI:** Catálogo interactivo de endpoints integrado con validaciones en tiempo real por **Zod**.

---

## 🛠️ Stack Tecnológico

* **Framework:** [Fastify 5](https://fastify.dev/) con arquitectura tipada `fastify-type-provider-zod`.
* **Lenguaje:** [TypeScript 5](https://www.typescriptlang.org/) ejecutado con `tsx` para Hot Reloading ultrarrápido.
* **ORM:** `sequelize-typescript` sobre motor MySQL / MariaDB.
* **Validación de Esquemas:** [Zod](https://zod.dev/).
* **Documentación:** `@fastify/swagger` y `@fastify/swagger-ui`.
* **Seguridad:** `@fastify/cors`, `@fastify/jwt`, `@fastify/rate-limit`, `bcryptjs`.
* **Logging:** Pino Logger con salida formateada `pino-pretty`.

---

## 📂 Estructura del Proyecto

```
Back/
├── src/
│   ├── config/             # Configuración de base de datos, JWT y CORS
│   ├── database/           # Modelos de Sequelize y script de seed
│   ├── middleware/         # Autenticación JWT y validadores de rol
│   ├── modules/
│   │   ├── admin/          # Métricas y control administrativo
│   │   ├── auth/           # Login, registro y refresh token
│   │   ├── guests/         # Control de visitantes y accesos
│   │   ├── inquiries/      # PQRS y soporte interno
│   │   ├── packages/       # Recepción de correspondencia y paquetería
│   │   ├── payments/       # Pagos y cuotas de administración
│   │   ├── properties/     # Inmuebles y asignación de residentes
│   │   ├── reservations/   # Calendario y reservas de zonas comunes
│   │   └── users/          # Gestión de perfiles y usuarios
│   ├── app.ts              # Pipeline de Fastify, plugins y rutas
│   └── server.ts           # Inicialización y listener HTTP
├── .env.example            # Plantilla de variables de entorno
├── Dockerfile              # Contenedor para despliegue en servidor/Docker
├── tsconfig.json           # Configuración del compilador TypeScript
└── package.json            # Scripts y dependencias
```

---

## ⚙️ Configuración e Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/jeisonMolina21/Guamal-Back.git
cd Guamal-Back
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Variables de entorno
Copia `.env.example` a `.env`:
```bash
cp .env.example .env
```

Configura tus credenciales:
```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
DATABASE_URL="mysql://usuario:password@localhost:3306/villa_mcj"
JWT_SECRET="tu_jwt_secret_seguro_aqui"
```

---

## ▶️ Scripts de Ejecución

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor en modo desarrollo con recarga en caliente (`tsx watch`). |
| `npm run build` | Compila el código TypeScript a JavaScript en `dist/`. |
| `npm start` | Ejecuta el servidor en modo producción. |
| `npm run seed` | Siembra los datos iniciales de prueba y roles en la base de datos. |

---

## 📖 Documentación Swagger

Con el servidor corriendo localmente, accede a la documentación interactiva en:
```
http://localhost:3000/documentation
```

---

## 📄 Licencia
Este proyecto es privado e institucional.
