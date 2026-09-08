# BarberOps

Sistema de gestión y control operativo en tiempo real para barberías.

## Stack

- **apps/web**: Next.js 15 (App Router) — panel admin + interfaz de barbero, responsive.
- **packages/api**: Fastify + TypeScript + Prisma + Socket.IO.
- **packages/shared**: tipos y validadores Zod compartidos.
- **PostgreSQL 16** como base de datos.

## Requisitos

- Node.js 20+
- Docker y Docker Compose (recomendado para levantar Postgres + servicios)

## Desarrollo local

```bash
npm install

# copiar variables de entorno
cp packages/api/.env.example packages/api/.env
cp apps/web/.env.example apps/web/.env.local

# levantar Postgres (o usar docker-compose completo)
docker compose up -d postgres

# generar cliente Prisma, migrar y poblar datos de ejemplo
npm run db:migrate
npm run db:seed

# levantar API y Web en paralelo (dos terminales)
npm run dev:api
npm run dev:web
```

La web queda en `http://localhost:3000`, la API en `http://localhost:3001`.

### Credenciales de seed

- Admin: `admin@barberia.com` / `admin123`
- Barberos: `juan@barberia.com`, `pedro@barberia.com`, `carlos@barberia.com` / `barbero123`

## Docker Compose (stack completo)

```bash
docker compose up --build
```

## Tests

```bash
npm run test:api
```

Los tests de integración de `service-sessions` requieren una base de datos Postgres accesible vía `DATABASE_URL` (usar una base de test separada).

## Notas de arquitectura

- El modelo de datos incluye `tenantId` en todas las tablas de negocio desde el día uno, preparando el sistema para evolucionar a un SaaS multi-tenant, aunque el MVP opera con un único tenant creado por el seed.
- El precio de un servicio se copia (`priceAtStart`) al iniciar cada sesión de servicio, por lo que cambios posteriores de precio no alteran el histórico.
- El dashboard en tiempo real usa Socket.IO (namespace `/dashboard`, rooms por tenant) para notificar inicio/fin/cancelación de servicios sin necesidad de recargar la página.
