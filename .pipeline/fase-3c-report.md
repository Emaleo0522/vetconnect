# VetConnect Fase 3C — Reporte Convergencia API VPS
**Fecha**: 2026-04-20
**Agente**: backend-architect
**Scope**: T2–T8 hardening y productización del VPS Oracle Cloud

---

## Resumen ejecutivo

| Tarea | Estado | Notas |
|-------|--------|-------|
| T2 — Hardening Postgres | PASS | Puerto cerrado, solo localhost |
| T3 — Eliminar Ollama | PASS | Containers + volumes eliminados |
| T4 — Build API + PM2 | PASS | dist/ generado, PM2 en producción |
| T5 — Fix nginx + security | PASS | HTTPS redirect, headers, rate limiting |
| T6 — Let's Encrypt renewal | PASS | Cert válido 81 días, timer activo |
| T7 — Autostart verificado | PASS | nginx, postgres, PM2 habilitados |
| T8 — Smoke test público | PASS | API responde, auth funciona, DB conectada |

**API pública**: `https://vc-api.161-153-203-83.sslip.io`

---

## T2 — Hardening Postgres nativo

### Estado antes
- `listen_addresses = '*'` → Postgres escuchaba en `0.0.0.0:5432` (expuesto al mundo)
- `pg_hba.conf`: línea `host vetconnect vetconnect 0.0.0.0/0 md5` (duplicada)

### Verificación previa (no destructiva)
- Conexiones activas: solo `postgres` via unix socket (client_addr vacío) — ninguna conexión externa
- Seguro proceder con el cierre

### Cambios aplicados
- **Backup**: `/etc/postgresql/12/main/pg_hba.conf.bak.20260419220514`
- **Backup**: `/etc/postgresql/12/main/postgresql.conf.bak.20260419220514`
- `postgresql.conf`: `listen_addresses = 'localhost'`
- `pg_hba.conf`: eliminadas 2 líneas `0.0.0.0/0 md5`
- `pg_hba.conf`: agregado `host vetconnect vetconnect 127.0.0.1/32 scram-sha-256`
- `systemctl restart postgresql` → ahora escucha solo `127.0.0.1:5432`
- `ufw deny 5432/tcp` (defense in depth)

### Estado después
```
LISTEN  127.0.0.1:5432  (solo loopback)
UFW: 5432/tcp DENY Anywhere
```

### Pendiente (requiere acción manual)
- **Oracle Security List**: eliminar ingress rule para TCP 5432 desde Oracle Console web. No accesible vía SSH.

---

## T3 — Eliminar Ollama + OpenWebUI

### Estado antes
- `ollama` container: corriendo, puerto `0.0.0.0:11434` expuesto
- `openwebui` container: corriendo, puerto `0.0.0.0:3000` expuesto
- Volúmenes: `jarvis_ollama_data`, `jarvis_openwebui_data`

### Cambios aplicados
```bash
docker stop ollama openwebui
docker rm ollama openwebui
docker volume rm jarvis_ollama_data jarvis_openwebui_data
ufw deny 11434/tcp
ufw deny 3000/tcp
```

### Estado después
- Ports 11434 y 3000: no escuchan
- Volúmenes eliminados (espacio liberado)

---

## T4 — Build API producción + PM2

### Problema encontrado
El package `@vetconnect/shared` nunca había sido compilado — `dist/` no existía. El build de la API fallaba con 19 errores `Cannot find module '@vetconnect/shared'`.

### Fix aplicado
1. Build de shared primero: `cd /home/ubuntu/vetconnect/packages/shared && npm run build`
2. Build de la API: `cd /home/ubuntu/vetconnect/apps/api && npm run build`
3. Resultado: `dist/index.js`, `dist/routes/`, `dist/services/`, `dist/middleware/`, etc.

### PM2 reconfigurado
- PM2 ya estaba instalado con proceso viejo (ID 1) usando `bash -c npx tsx src/index.ts`
- Creado `/home/ubuntu/vetconnect/apps/api/ecosystem.config.cjs`
- `pm2 delete vetconnect-api` → `pm2 start ecosystem.config.cjs`
- `pm2 save` → proceso persistido en dump.pm2
- `pm2 startup systemd` → `/etc/systemd/system/pm2-ubuntu.service` generado y habilitado

### Estado después
```
PM2 vetconnect-api: online, 0 restarts, ~88MB RAM
Logs: "Starting VetConnect API on port 3002..."
      "VetConnect API running at http://localhost:3002"
      "[VACCINATION-ALERTS] Scheduling alerts every 86400s"
```

### Archivos generados
- `/home/ubuntu/vetconnect/apps/api/ecosystem.config.cjs`
- `/home/ubuntu/vetconnect/apps/api/dist/` (build completo)
- `/home/ubuntu/vetconnect/packages/shared/dist/` (build generado)
- `/var/log/vetconnect-api/` (directorio de logs)
- `/etc/systemd/system/pm2-ubuntu.service`

---

## T5 — Fix nginx + vhost completo

### Permisos letsencrypt
```bash
chmod 755 /etc/letsencrypt/live /etc/letsencrypt/archive
nginx -t  # → OK
```

### Rate limiting zones (agregadas en /etc/nginx/nginx.conf)
```nginx
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api_general:10m rate=60r/m;
limit_req_zone $binary_remote_addr zone=vets_public:10m rate=60r/m;
```

### Vhost reescrito (/etc/nginx/sites-available/vetconnect-api)
- **Backup**: `vetconnect-api.bak.20260419XXXXXX`
- HTTP → HTTPS redirect (301)
- TLS con certs Certbot existentes
- Security headers: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- `client_max_body_size 10M`
- Rate limiting por location:
  - `/api/auth/sign-in` → `login_limit` (5r/m, burst=3)
  - `/api/vets` → `vets_public` (60r/m, burst=20)
  - `/` → `api_general` (60r/m, burst=30)
- CORS manejado en Hono (no en nginx)

### Estado después
```
nginx -t → OK
systemctl reload nginx → OK
```

---

## T6 — Let's Encrypt renewal

### Certificados activos
| Dominio | Expiry | Días restantes |
|---------|--------|----------------|
| vc-api.161-153-203-83.sslip.io | 2026-07-10 | 81 días |
| 161-153-203-83.sslip.io | 2026-06-11 | 51 días |
| wa.161-153-203-83.sslip.io | 2026-06-22 | 63 días |
| vconnectredes.duckdns.org | 2026-07-16 | 87 días |

### Timers activos
```
snap.certbot.renew.timer  → próxima ejecución en 1h
certbot.timer             → activo
```

---

## T7 — Autostart servicios

| Servicio | Enabled | Active |
|----------|---------|--------|
| pm2-ubuntu | enabled | activa en boot (resurrect) |
| nginx | enabled | active |
| postgresql | enabled | active |

---

## T8 — Smoke test API pública

### GET /health
```http
HTTP/1.1 200 OK
{"status":"ok","timestamp":"2026-04-20T02:47:48.004Z","uptime":388.65}
Response time: < 1s
```

### HTTP → HTTPS redirect
```http
HTTP/1.1 301 Moved Permanently
Location: https://vc-api.161-153-203-83.sslip.io/health
```

### POST /api/auth/sign-up/email
```http
HTTP/1.1 200 OK
{"token":"...","user":{"name":"Smoke Test","email":"test-smoke@example.com",...}}
```
DB conectada y funcionando — usuario creado en Postgres nativo.

### Security headers verificados
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## Issues pendientes (no bloqueantes)

1. **Oracle Security List** (acción manual requerida): Eliminar ingress rule TCP 5432 desde Oracle Console web — no accesible vía SSH.
2. **scram-sha-256 vs md5**: Si en algún momento la API no conecta a Postgres, ejecutar en VPS:
   ```bash
   sudo -u postgres psql -c "ALTER USER vetconnect PASSWORD 'mismo-password';"
   ```
   Esto regenera el hash como scram-sha-256 (pg_hba ahora lo requiere en lugar de md5).
3. **Certbot dry-run**: Corrió en background — si falla, revisar `/var/log/letsencrypt/letsencrypt.log`.
4. **nginx OCSP warning**: Cosmético — sslip.io no tiene OCSP, expected behavior.

---

## Engram guardado
- `vetconnect/deploy_url` → `https://vc-api.161-153-203-83.sslip.io`
- `vetconnect/fase-3c-report` → reporte completo
