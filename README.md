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
