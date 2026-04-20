# VetConnect Global — Plan de tareas granular (v2 — recuperación 2026-04-19)
Fecha: 2026-04-19
Modo: modificación (proyecto existente — reemplaza plan previo 2026-04-10)
Stack: monorepo Next.js 16 + Hono + Drizzle + Postgres + Better Auth (existente, NO migrar) + repo separado Vite+React para landing
Orden: housekeeping → C → B → A → D

> Fuente canónica: Engram `vetconnect/tareas`. Este archivo es mirror de disco para resiliencia.

Total: 48 tareas
- housekeeping: 1 (T0)
- Fase C (Deploy API VPS): 8 (T1–T8)
- Fase B (Fix Auth): 3 (T9–T11)
- Fase A (Landing nueva): 5 (T12–T16)
- Fase D (Rediseño webapp 6 módulos): 31 (T17–T47)

Ver contenido detallado con criterios de aceptación, archivos y riesgos en Engram (observation `vetconnect/tareas`).

## Dependencias críticas cross-fase
- T8 (smoke test API) bloquea T9 (fix contrato auth)
- T11 (CORS + env-driven) bloquea T17 (foundation webapp)
- T16 (landing deploy) independiente de D, paralelizable
- T19 (nav 6 módulos) bloquea D.1–D.6 que pueden ir en paralelo

## Riesgos top 3
1. T7 Let's Encrypt: Oracle Cloud Security List puede bloquear puerto 80 — plan B self-signed
2. T9 Contrato auth: refactor cross-package (api + web + shared) — testear e2e
3. T34 Cron recordatorios: proceso in-container, si crashea no hay monitoring → healthcheck
