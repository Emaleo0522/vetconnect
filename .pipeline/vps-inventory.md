# VPS Inventory — Oracle Cloud 161.153.203.83
Fecha inspección: 2026-04-20
Modo: READ-ONLY (ningún cambio realizado)

---

## 1. Sistema Base

| Campo | Valor |
|-------|-------|
| OS | Ubuntu 20.04.6 LTS (Focal) |
| Arquitectura | aarch64 (ARM64) |
| Uptime | 41 días 3h |
| RAM total | 23 GB |
| RAM usada | 2.2 GB (9.5%) |
| RAM disponible | 20 GB |
| Disco raíz (`/dev/sda1`) | 194 GB total, 25 GB usados (13%) — **169 GB libres** |

---

## 2. Servicios Docker Running

| Container | Imagen | Status | Puertos HOST->Container |
|-----------|--------|--------|------------------------|
| `pocketbase` | ghcr.io/muchobien/pocketbase:latest | Up 7h | 0.0.0.0:8090->8090 |
| `portainer` | portainer/portainer-ce:latest | Up 31h | 0.0.0.0:9000->9000, 0.0.0.0:9443->9443 |
| `ollama` | ollama/ollama:latest | Up 31h | 0.0.0.0:11434->11434 |
| `openwebui` | ghcr.io/open-webui/open-webui:main | Up 31h (healthy) | 0.0.0.0:3000->8080 |
| `vconnect-pb` | ghcr.io/muchobien/pocketbase:0.36.9 | Up 2d (healthy) | 127.0.0.1:8091->8090 (loopback only) |
| `vconnect-watchtower` | containrrr/watchtower:latest | Up 2d (healthy) | 8080 (internal only) |

**Nota VetConnect existente**: `vconnect-pb` es PocketBase de Vconnect (proyecto hermano), expuesto solo en loopback 127.0.0.1:8091. Bien aislado.

**Docker volumes**:
- `jarvis_ollama_data` — datos de modelos Ollama
- `jarvis_openwebui_data` — datos de OpenWebUI
- `portainer_data` — datos de Portainer

---

## 3. Servicios Systemd Running (relevantes)

| Servicio | Estado |
|----------|--------|
| `nginx.service` | running |
| `postgresql@12-main.service` | running |
| `docker.service` | running |
| `ssh.service` | running |
| `cron.service` | running |

El resto son servicios base del OS (networkd, resolved, logind, etc.). Sin systemd units para Ollama (solo Docker).

---

## 4. Puertos Expuestos (red pública)

| Puerto | Protocolo | Qué escucha |
|--------|-----------|-------------|
| 22 | TCP | SSH |
| 80 | TCP | nginx |
| 443 | TCP | nginx |
| 3000 | TCP | OpenWebUI (via Docker) |
| 5432 | TCP | PostgreSQL nativo — EXPUESTO PUBLICAMENTE (ver alertas) |
| 8090 | TCP | PocketBase (container, red pública) |
| 9000 | TCP | Portainer HTTP |
| 9443 | TCP | Portainer HTTPS |
| 11434 | TCP | Ollama (via Docker, red pública) |

**Puertos internos** (no expuestos al exterior por UFW):
| Puerto | Qué escucha |
|--------|-------------|
| 3001 | whatsapp-dashboard (node process) |
| 3002 | **VetConnect API actual** (node/tsx desde /home/ubuntu/vetconnect/apps/api) |
| 8091 | vconnect-pb PocketBase (127.0.0.1 loopback) |

---

## 5. Puerto 80 Status

**OPEN — nginx escucha y responde.**
- Prueba desde local: `curl http://161.153.203.83/` → `HTTP/1.1 404 Not Found` (nginx, no Oracle Security List bloqueando)
- UFW: puerto 80 ALLOW IN desde Anywhere
- iptables: regla ACCEPT en INPUT para dpt:80

**No hay bloqueador de Oracle Security List para puerto 80.** Let's Encrypt HTTP-01 challenge es viable.

---

## 6. Puerto 443 Status

**OPEN — nginx escucha y responde con TLS.**
- Prueba desde local: `curl -k https://161.153.203.83/` → `HTTP/1.1 404 Not Found` + headers de PocketBase (vconnect-pb en default HTTPS)
- UFW: puerto 443 ALLOW IN desde Anywhere
- iptables: regla ACCEPT en INPUT para dpt:443

---

## 7. Ollama Presence — Candidato a Eliminar

- **Container Docker**: `ollama` (ID: 81c43acc51be), imagen `ollama/ollama:latest`, Up 31h, puerto 11434 público
- **Volume**: `jarvis_ollama_data` (datos de modelos — potencialmente grande)
- **Systemd units**: NINGUNO — solo Docker
- **OpenWebUI** (`openwebui` container) depende de Ollama — si se elimina Ollama, OpenWebUI pierde su backend

**Para T3** (eliminar Ollama):
```bash
docker stop ollama openwebui
docker rm ollama openwebui
docker volume rm jarvis_ollama_data jarvis_openwebui_data
# Verificar que openwebui no tenga otras dependencias antes
```
**ADVERTENCIA**: también hay que cerrar puerto 3000 (OpenWebUI) y 11434 (Ollama) en UFW si se eliminan.

---

## 8. nginx Config Existente

### Vhosts en sites-enabled:
| Vhost | Descripción |
|-------|-------------|
| `pocketbase` | Proxy a pocketbase container 8090 |
| `vconnectredes.duckdns.org` | Proxy a vconnect-pb (127.0.0.1:8091) — config completa con rate limiting, CORS, security headers, TLS 1.2/1.3 |
| `vetconnect-api` | **Proxy a localhost:3002** — ya configurado con TLS via sslip.io |
| `wa-dashboard` | Proxy a whatsapp-dashboard (puerto 3001) |

### Estado de nginx:
- **`nginx -t` FALLA** con error de permiso para leer `/etc/letsencrypt/live/161-153-203-83.sslip.io/fullchain.pem`
  - Causa: nginx corre como usuario `www-data` y no tiene permisos de lectura del directorio `/etc/letsencrypt/live/`
  - **nginx está corriendo correctamente** a pesar del test fallido (usa `sudo nginx -t` para test correcto)
  - Fix en T5/T6: `sudo chmod 755 /etc/letsencrypt/{live,archive}/` o agregar `www-data` al grupo `ssl-cert`

### VetConnect API vhost actual:
```nginx
server {
    listen 80;
    server_name vc-api.161-153-203-83.sslip.io;
    location / {
        proxy_pass http://localhost:3002;
        ...headers estándar...
    }
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/vc-api.161-153-203-83.sslip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vc-api.161-153-203-83.sslip.io/privkey.pem;
}
```

**IMPORTANTE**: El dominio ya es `vc-api.161-153-203-83.sslip.io` (NO nip.io como se planificó). Certbot snap ya emitió certs para este dominio. El plan de usar `api-161-153-203-83.nip.io` debe **actualizarse** al dominio real: `vc-api.161-153-203-83.sslip.io`.

### http/2:
- nginx 1.18.0 (Ubuntu 20.04) — compilado SIN `--with-http_v2_module`. HTTP/2 no disponible en este binario. HTTP/1.1 es lo máximo disponible sin recompilar o actualizar nginx.

---

## 9. PostgreSQL Nativo — Aislamiento

### Bases de datos existentes:
| DB | Owner | Acceso |
|----|-------|--------|
| `postgres` | postgres | superuser |
| `template0` | postgres | system |
| `template1` | postgres | system |
| `vetconnect` | vetconnect | vetconnect user |

### pg_hba.conf:
- `host vetconnect vetconnect 0.0.0.0/0 md5` — acceso externo con password desde cualquier IP
- Resto de bases solo acceso local/loopback

### ALERTA DE SEGURIDAD — Puerto 5432 expuesto:
- `5432` está en iptables con `ACCEPT NEW tcp dpt:5432` (expuesto al mundo)
- `pg_hba.conf` tiene `0.0.0.0/0` para la DB vetconnect
- Esto permite conexiones externas con solo usuario+password
- **Para T5**: debe cerrarse en iptables/UFW. El nuevo postgres Docker NO debe publicar 5432.

### Decisión: ¿Docker Postgres o Postgres Nativo?
La DB `vetconnect` ya existe en el postgres nativo con el schema actual. El proceso node ya conecta a ella (`DATABASE_URL=postgresql://vetconnect:...@localhost:5432/vetconnect`). **Recomendación para el orquestador**: usar el postgres nativo existente en lugar de levantar uno nuevo en Docker. Evita migración y ya tiene datos. Solo hay que cerrar el puerto 5432 al exterior.

---

## 10. Decisión Bloqueante

**NO hay bloqueo por Oracle Security List.** Puertos 80 y 443 están abiertos y nginx responde.

Sin embargo hay 3 hallazgos que cambian el plan de T2-T7:

1. **La API ya está deployada** — `apps/api` corre en `/home/ubuntu/vetconnect/apps/api` con `tsx` (modo dev con watch), escuchando en 3002. El vhost nginx y los certs de `vc-api.161-153-203-83.sslip.io` ya existen.

2. **El dominio es sslip.io, NO nip.io** — `vc-api.161-153-203-83.sslip.io` con certs Let's Encrypt emitidos por certbot snap (v5.5.0, funcional). El certbot nativo Python está roto pero el snap funciona.

3. **Postgres nativo ya tiene DB `vetconnect`** — No necesitamos Docker postgres nuevo. Solo asegurar que 5432 no esté expuesto al exterior.

---

## 11. Recomendación para T2–T7

### Red Docker
- NO crear red Docker nueva para postgres — usar postgres nativo en host con socket Unix o `host.docker.internal`
- Si se necesita futuro container que acceda a postgres, usar `--network=host` o socket bind

### Puertos internos sugeridos
- API VetConnect: `3002` (ya en uso — mantener)
- nginx upstream: `proxy_pass http://localhost:3002` (ya configurado)
- Postgres: socket Unix `/var/run/postgresql/.s.PGSQL.5432` (sin exponer TCP)

### Dominio y TLS
- **Usar `vc-api.161-153-203-83.sslip.io`** — ya resuelve a la IP, ya tiene certs Let's Encrypt
- Actualizar `BETTER_AUTH_URL` y `CORS_ORIGINS` en `.env` si cambia algo
- Certbot snap: `/snap/bin/certbot renew` para renovación

### Acciones prioritarias para T2-T7
1. **T2**: Cerrar puerto 5432 en UFW (`sudo ufw delete allow 5432` + verificar iptables)
2. **T3**: Eliminar Ollama + OpenWebUI (containers + volumes `jarvis_ollama_data` + `jarvis_openwebui_data`) + cerrar puertos 3000 y 11434 en UFW
3. **T4**: Fix permisos `/etc/letsencrypt/` para nginx (`chmod 755 live/ archive/` o `chgrp www-data`)
4. **T5**: Convertir la API de `tsx src/index.ts` (modo dev) a proceso productivo con PM2 o systemd service
5. **T6**: Verificar schema/migraciones contra DB existente (no crear nueva DB)
6. **T7**: Actualizar `.env` con valores correctos (CORS, dominios finales)
7. **T8**: Test E2E del endpoint `/health` y auth endpoints via `vc-api.161-153-203-83.sslip.io`

---

## 12. Estado Final

| Item | Estado |
|------|--------|
| SSH acceso | OK |
| Puerto 80 | OPEN — nginx responde |
| Puerto 443 | OPEN — nginx + TLS responde |
| API VetConnect | RUNNING en 3002 (tsx dev mode) |
| nginx vhost vetconnect-api | EXISTS — apunta a 3002 |
| TLS certs sslip.io | EXISTS — certbot snap emitidos |
| Postgres DB vetconnect | EXISTS — nativo, datos actuales |
| Puerto 5432 expuesto | ALERTA — debe cerrarse |
| Ollama | RUNNING — candidato a eliminar en T3 |
| Listo para T2+ | YES — con ajustes al plan |
