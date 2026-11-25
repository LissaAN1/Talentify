# Talentify

Marketplace universitario de microservicios (Gerencia de Proyectos · Universidad Icesi · 2026-2).

| Carpeta | Contenido | Puerto local |
|---|---|---|
| `back/` | API REST con NestJS, TypeORM y PostgreSQL | 3000 |
| `front/` | Aplicación web con Next.js | 3001 |

## Ejecución rápida

1. `cd back && docker compose up -d && pnpm install && pnpm start:dev`
2. `cd front && pnpm install && pnpm dev --port 3001`

Cada carpeta tiene su propio README con el detalle.

## Flujo de trabajo

- `main`: versión entregada (solo recibe `dev` al cerrar cada sprint).
- `dev`: integración. Todas las HU entran aquí con Pull Request.
- `feature/HU-XX-nombre`: una rama por historia de usuario.
- Commits: `tipo(HU-XX): descripción`.

## Documentación de la API (Swagger)

Con el backend en marcha, la documentación interactiva está en `http://localhost:3000/api/docs`.
Cada endpoint aparece agrupado por módulo (Auth, Users, Services) y se puede probar con el botón
**Authorize**, pegando el token JWT que devuelve `POST /auth/login`.

## Despliegue

El archivo [`render.yaml`](render.yaml) describe los tres recursos para desplegar en [Render](https://render.com)
como *Blueprint*: la base de datos PostgreSQL, la API (`back/`) y el frontend (`front/`).

| Variable | Servicio | Descripción |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | API | Se toman de la base de datos creada por el Blueprint |
| `JWT_SECRET` | API | Se genera automáticamente en Render |
| `FRONTEND_URL` | API | URL pública del frontend (CORS); admite varias separadas por coma |
| `NEXT_PUBLIC_API_URL` | Frontend | URL pública de la API |

Pasos: crear el Blueprint, esperar el primer despliegue, copiar la URL del frontend en `FRONTEND_URL`
de la API y la URL de la API en `NEXT_PUBLIC_API_URL` del frontend, y volver a desplegar ambos.

| Recurso | URL pública |
|---|---|
| API | https://talentify-api-58gy.onrender.com |
| Swagger | https://talentify-api-58gy.onrender.com/api/docs |
| Frontend | https://talentify-web.onrender.com |

Nunca se suben `.env` ni llaves reales: solo variables de entorno en el panel de Render.

## Guía para la sustentación

Usuarios de demostración (los crea el seed de la API):

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@u.icesi.edu.co` | `Admin12345` |
| Proveedor | `provider@u.icesi.edu.co` | `Provider12345` |
| Cliente | `client@u.icesi.edu.co` | `Client12345` |

Pagos con Stripe (modo de prueba): `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` se configuran solo en las
variables de entorno de la API en Render. El webhook apunta a `<URL de la API>/payments/webhook` y escucha
`checkout.session.completed`. Para probar un pago, entra como cliente, abre una orden en estado PENDING y pulsa
**Pagar con Stripe**; usa la tarjeta `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC. Al volver, la
orden pasa a PAID gracias al webhook.

Nota sobre el plan gratuito de Render: la API y el frontend se duermen tras unos minutos sin tráfico y la primera
petición puede tardar cerca de 50 segundos. Conviene abrir ambas URLs unos minutos antes de presentar.
