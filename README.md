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
| API | _pendiente de desplegar en Render_ |
| Swagger | _`<URL de la API>/api/docs`_ |
| Frontend | _pendiente de desplegar en Render_ |

Nunca se suben `.env` ni llaves reales: solo variables de entorno en el panel de Render.
