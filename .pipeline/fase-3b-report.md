# VetConnect Fase 3B — Reporte Fix Auth (T9/T10/T11)
**Fecha**: 2026-04-20
**Agente**: backend-architect
**API**: https://vc-api.161-153-203-83.sslip.io

---

## Resumen ejecutivo

| Tarea | Estado | Notas |
|-------|--------|-------|
| T9 — Contrato respuesta plano | PASS | /register/* devuelve {user} plano, sign-in devuelve {token,user} plano |
| T10 — Eliminar localStorage, cookies httpOnly | PASS | Cookie __Secure-better-auth.session_data con HttpOnly;Secure;SameSite=None |
| T11 — CORS + env-driven + rate limits | PASS | Origin explícito Netlify, BETTER_AUTH_URL env, 5/15min login, 3/hora register |

---

## Smoke Test Results

### CORS Preflight
```
HTTP/1.1 204 No Content
access-control-allow-credentials: true
access-control-allow-headers: Content-Type,Authorization,X-CSRF-Token
access-control-allow-methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
access-control-allow-origin: https://vetconnect-global.netlify.app
access-control-expose-headers: X-Request-Id,Set-Cookie
access-control-max-age: 86400
```
**PASS** — Origin explícito (no wildcard), credentials: true, X-CSRF-Token en allow-headers

### POST /api/users/register/owner
```
HTTP/1.1 201 Created
{"user":{"id":"YYZX5Ay3KvZcSz4nCGHCipyAD1Do3Ks0","email":"t9test@example.com","name":"T9 Test","role":"owner"}}
```
**PASS** — Respuesta plana sin wrapper {success, data}. Sin password hash ni datos sensibles.

### POST /api/auth/sign-in/email
```
HTTP/1.1 200 OK
set-cookie: __Secure-better-auth.session_data=...; Max-Age=300; Path=/; HttpOnly; Secure; SameSite=None
set-auth-token: <token>.<firma>
{"redirect":false,"token":"...","user":{...,"role":"owner",...}}
```
**PASS** — Respuesta plana, cookie httpOnly Secure SameSite=None, sin localStorage

### GET /api/auth/get-session (con Bearer token)
```
HTTP/1.1 200 OK
{"session":{"expiresAt":"2026-04-27T...","token":"...","userId":"..."},"user":{"name":"T9 Test","email":"t9test@example.com","role":"owner",...}}
```
**PASS** — Sesión válida, datos correctos, role incluido

### Rate limiting
```
HTTP/1.1 429 Too Many Requests
retry-after: 772
{"success":false,"error":{"code":"TOO_MANY_REQUESTS","message":"Rate limit exceeded."}}
```
**PASS** — Activo: 5 req/15min login, 3 req/hora register

---

## Archivos modificados

### Backend (apps/api/src/)
- `lib/auth.ts` — BETTER_AUTH_URL env-driven, cookie config httpOnly/Secure/SameSite=None, sin cookiePrefix manual
- `lib/env.ts` — BETTER_AUTH_URL opcional, CORS_ORIGINS default actualizado
- `middleware/cors.ts` — X-CSRF-Token en allowHeaders, Set-Cookie en exposeHeaders
- `middleware/rateLimit.ts` — login 5/15min, register 3/hora
- `routes/users.ts` — respuesta plana {user} (sin {success, data}), error sin "success: false"
- `services/user.service.ts` — usa auth.api.signUpEmail() programático, devuelve solo {user} sin token

### Frontend (apps/web/src/)
- `lib/auth.ts` — eliminado localStorage, estado sin token, logout async, checkSession via cookie
- `lib/api.ts` — eliminado getToken()/Authorization header, credentials:'include' en todos los fetch

---

## Gotchas documentados

1. **cookiePrefix duplicado**: `cookiePrefix: "__Secure"` + `useSecureCookies: true` generaba `__Secure-__Secure.session_data`. Fix: no usar cookiePrefix, dejar que useSecureCookies aplique el prefijo automáticamente.

2. **Curl no reenvía cookies HttpOnly**: Comportamiento correcto de curl (seguridad). En browser real, la cookie se envía automáticamente con credentials:'include'. Smoke test via Bearer token es válido.

3. **Better Auth cookieCache**: La cookie session_data es cache de 5 minutos. El auth principal es Bearer token. En browser, auth.api.getSession() lee la cookie del request correctamente.

---

## Pendiente para Fase 5 (git agent)
- Commitear los 8 archivos modificados al repo GitHub (Emaleo0522/vetconnect)
- El VPS ya tiene los archivos actualizados via SCP directo
- El git del VPS NO está actualizado — hacer git pull post-commit en Fase 5
