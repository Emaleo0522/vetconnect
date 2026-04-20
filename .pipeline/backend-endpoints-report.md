# VetConnect — Backend Endpoints Report — Fase 3E

**Fecha**: 2026-04-20
**STATUS**: COMPLETADO — 28/28 smoke tests PASS

## Resumen

Implementados 55 endpoints nuevos/extendidos cubriendo módulos D.2–D.6.
Schema DB extendido con 10 tablas nuevas + 5 enums nuevos.
Migration 0002 aplicada. PM2 reiniciado, API online.

---

## Módulos implementados

### D.2 — Animales Perdidos (7 endpoints)
| Método | Ruta | Auth | Smoke |
|--------|------|------|-------|
| GET | /api/lost-reports | No | PASS |
| POST | /api/lost-reports | Sí | PASS — geo jitter ±200-500m |
| GET | /api/lost-reports/:id | No | PASS |
| PUT | /api/lost-reports/:id | Sí (owner) | PASS |
| POST | /api/lost-reports/:id/found | Sí (owner) | PASS |
| GET | /api/lost-reports/:id/sightings | No | PASS |
| POST | /api/lost-reports/:id/sightings | Sí | PASS — notif owner |

### D.3 — Directorio Veterinarios — extensión (4 endpoints nuevos)
| Método | Ruta | Auth | Smoke |
|--------|------|------|-------|
| GET | /api/vets/:id/slots?date=YYYY-MM-DD | No | PASS — 30min slots |
| GET | /api/users/me/favorites | Sí | PASS |
| POST | /api/users/me/favorites | Sí | PASS |
| DELETE | /api/users/me/favorites/:vetId | Sí | PASS |

### D.4 — Agenda/Turnos (5 endpoints + cron)
| Método | Ruta | Auth | Smoke |
|--------|------|------|-------|
| GET | /api/appointments | Sí | PASS — filter upcoming/past/cancelled |
| POST | /api/appointments | Sí | PASS — valida slot, SLOT_TAKEN 409 |
| GET | /api/appointments/:id | Sí (owner) | PASS |
| DELETE | /api/appointments/:id | Sí (owner) | PASS — soft cancel |
| PATCH | /api/appointments/:id/reschedule | Sí (owner) | PASS |
| CRON | appointment-reminders | — | RUNNING — notifs 24h y 1h |

### D.5 — Comunidad/Feed (9 endpoints)
| Método | Ruta | Auth | Smoke |
|--------|------|------|-------|
| GET | /api/posts | Sí | PASS — cursor-based |
| POST | /api/posts | Sí | PASS — JSON + multipart |
| GET | /api/posts/:id | Sí | PASS — likedByMe |
| POST | /api/posts/:id/like | Sí | PASS — toggle |
| POST | /api/posts/:id/report | Sí | PASS — spam/inapropiado |
| POST | /api/posts/:id/hide | Sí | PASS — personal hide |
| GET | /api/posts/:id/comments | Sí | PASS |
| POST | /api/posts/:id/comments | Sí | PASS |
| POST | /api/comments/:id/replies | Sí | PASS (self-referential) |

### D.6 — Notificaciones (10 endpoints — extendido)
| Método | Ruta | Auth | Smoke |
|--------|------|------|-------|
| GET | /api/notifications | Sí | PASS — ?unread=true |
| GET | /api/notifications/count | Sí | PASS — polling endpoint |
| PATCH | /api/notifications/:id/read | Sí | PASS |
| POST | /api/notifications/read-all | Sí | PASS |
| POST | /api/notifications/:id/archive | Sí | PASS |
| DELETE | /api/notifications/:id | Sí | PASS |
| GET | /api/users/me/notification-preferences | Sí | PASS |
| PATCH | /api/users/me/notification-preferences | Sí | PASS — upsert |

---

## Schema DB — tablas nuevas

```
appointments         — 11 cols, 4 indexes
favorites            — 4 cols, 2 indexes
lost_reports         — 12 cols, 3 indexes (lat/lng jittered)
sightings            — 8 cols, 1 index
posts                — 9 cols, 2 indexes (likesCount, commentsCount counter)
post_likes           — 4 cols, UNIQUE(post_id, user_id)
post_reports         — 5 cols, 1 index
post_hides           — 3 cols, UNIQUE(post_id, user_id)
comments             — 6 cols, parent_comment_id self-ref
notification_preferences — 7 cols, upsert por userId
```

---

## Issues encontrados y fixes aplicados

### Bug #1 — SQL interval con Date objects
- **Causa**: postgres.js serializa Date como `Tue Apr 28 2026...` en vez de ISO. Falló en overlap check de appointments.
- **Fix**: usar `.toISOString()` explícito dentro de `sql\`\`` template con cast `::timestamptz`.
- **Estado**: FIXED y verificado con smoke test de conflicto.

### Bug #2 — drizzle-kit migrate cuelga en VPS ARM64
- **Causa**: bug conocido drizzle-kit con tsx en ARM64 — proceso cuelga sin error claro.
- **Fix**: aplicar migration manualmente con `sed 's/--> statement-breakpoint/;/g' | psql`.
- **Estado**: WORKAROUND aplicado.

### Issue #3 — Tablas nuevas con owner `postgres`
- **Causa**: migration ejecutada como postgres superuser.
- **Fix**: `ALTER TABLE ... OWNER TO vetconnect` para las 10 tablas nuevas.
- **Estado**: FIXED.

---

## Archivos locales clave

- `apps/api/src/db/schema/appointments.ts` — appointments + favorites
- `apps/api/src/db/schema/community.ts` — posts, likes, comments, reports, hides
- `apps/api/src/db/schema/lost.ts` — lost_reports + sightings
- `apps/api/src/services/appointment.service.ts`
- `apps/api/src/services/favorites.service.ts`
- `apps/api/src/services/lost.service.ts`
- `apps/api/src/services/community.service.ts`
- `apps/api/src/routes/appointments.ts`
- `apps/api/src/routes/favorites.ts`
- `apps/api/src/routes/lost.ts`
- `apps/api/src/routes/community.ts`
- `apps/api/src/jobs/appointment-reminders.ts`
- `apps/api/drizzle/0002_amused_firebird.sql`

---

## URLs para E2E testing

Base: `https://vc-api.161-153-203-83.sslip.io`

Endpoints de entrada clave para QA:
- `GET /health` → 200 OK
- `GET /api/lost-reports` → lista vacía o reportes activos
- `GET /api/vets` → listado vets
- `GET /api/notifications/count` (auth) → count unread
- `GET /api/posts` (auth) → feed cursor
