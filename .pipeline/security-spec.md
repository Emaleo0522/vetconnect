# Security Spec -- VetConnect Global
Fecha: 2026-04-10
Autor: security-engineer

---

## 1. STRIDE Threat Model

### 1.1 Componente: Autenticacion (Better Auth + JWT + Refresh Tokens)

| Amenaza | Tipo STRIDE | Riesgo | Mitigacion |
|---------|-------------|--------|------------|
| Robo de JWT desde storage inseguro | Spoofing | CRITICO | Usar Expo SecureStore (ya planeado). NUNCA AsyncStorage para tokens. SecureStore usa Keychain (iOS) y EncryptedSharedPreferences (Android) |
| Brute force en login | Spoofing | ALTO | Rate limiting: 5 intentos / 15 min por IP + 10 intentos / 1 hora por cuenta. Lockout temporal de 30 min tras 10 fallos |
| Refresh token robado permite sesion persistente | Spoofing | ALTO | Refresh token rotation: cada uso genera nuevo par. Invalidar familia completa si se detecta reuso de token ya rotado |
| JWT sin expiracion corta | Tampering | ALTO | Access token: 15 min. Refresh token: 7 dias. Almacenar refresh tokens hasheados en DB (SHA-256) |
| Escalacion de rol (dueno -> veterinario) | Elevation | CRITICO | Verificar rol server-side en CADA request. Middleware de Hono valida rol del JWT contra DB. Nunca confiar en claims del token sin verificacion |
| Registro masivo de cuentas falsas | Repudiation | MEDIO | Rate limit en registro: 3 cuentas / hora por IP. Verificacion de email obligatoria antes de activar cuenta |
| Enumeracion de usuarios via login/registro | Info Disclosure | MEDIO | Respuesta generica: "Credenciales invalidas" (login) y "Si el email existe, recibirás un enlace" (registro/reset). Mismo tiempo de respuesta para usuario existente y no existente |

### 1.2 Componente: Perfil de Mascota + Historial Medico

| Amenaza | Tipo STRIDE | Riesgo | Mitigacion |
|---------|-------------|--------|------------|
| Acceso no autorizado a datos medicos | Info Disclosure | CRITICO | RBAC estricto: solo el dueno y veterinarios vinculados pueden ver historial completo. Middleware verifica ownership en cada request |
| Modificacion de historial medico por usuario no autorizado | Tampering | CRITICO | Solo rol Veterinario puede crear/editar registros medicos. Audit trail inmutable (tabla audit_log con actor_id, action, timestamp, old_value_hash) |
| IDOR en endpoints de mascotas (/api/pets/:id) | Elevation | CRITICO | Validar que pet.owner_id === authenticated_user.id O que el usuario tiene rol Veterinario vinculado. Usar UUIDs v4 (no IDs secuenciales) para pets y records |
| Datos medicos sensibles expuestos en logs | Info Disclosure | ALTO | NUNCA logear alergias, condiciones, medicacion. Sanitizar logs: redactar campos sensibles. Logear solo pet_id, action, actor_id |
| Borrado malicioso de historial | Tampering | ALTO | Soft delete obligatorio para registros medicos. Solo Admin puede purgar datos (con audit trail) |

### 1.3 Componente: QR Code Publico

| Amenaza | Tipo STRIDE | Riesgo | Mitigacion |
|---------|-------------|--------|------------|
| QR expone datos sensibles de la mascota | Info Disclosure | ALTO | El QR apunta a endpoint publico que retorna SOLO: nombre, raza, foto, estado de vacunacion (si/no), telefono de contacto del dueno. NUNCA: alergias, medicacion, condiciones, direccion completa |
| Scraping masivo de fichas publicas via QR URLs | DoS | MEDIO | Rate limiting: 30 requests / min por IP en endpoint publico. Agregar header Cache-Control: private, no-store |
| Enumeracion de mascotas via QR URL secuencial | Info Disclosure | MEDIO | Usar UUID v4 en la URL del QR (no ID numerico). URL: /public/pet/{uuid} |

### 1.4 Componente: Cartilla Vacunatoria + Link Temporal

| Amenaza | Tipo STRIDE | Riesgo | Mitigacion |
|---------|-------------|--------|------------|
| Link temporal reutilizado despues de expirar | Spoofing | ALTO | JWT firmado con exp de 24h. Incluir pet_id y sharer_id en claims. Validar expiracion server-side. No cachear respuesta |
| Link temporal compartido a tercero no autorizado | Info Disclosure | MEDIO | El link muestra datos de vacunacion (no sensibles) pero incluir disclaimer visible. Considerar one-time-use tokens para mayor seguridad (marcar como usado en DB tras primer acceso) |
| Manipulacion de registros de vacunas | Tampering | CRITICO | Solo Veterinario puede crear registros de vacunacion. Incluir veterinario_id, fecha, lote en cada registro. Audit trail obligatorio |

### 1.5 Componente: Directorio Veterinario + Mapa (Leaflet)

| Amenaza | Tipo STRIDE | Riesgo | Mitigacion |
|---------|-------------|--------|------------|
| Inyeccion en busqueda de veterinarios | Injection | ALTO | Queries parametrizadas con Drizzle (ya seguro por default). Validar input con Zod: max 100 chars, solo alfanumerico + espacios + acentos |
| Resenas falsas / spam | Repudiation | MEDIO | Solo usuarios autenticados con mascota registrada pueden dejar resena. 1 resena por usuario por veterinario. Rate limit: 5 resenas / hora por usuario |
| GPS spoofing para manipular resultados | Tampering | BAJO | Validar coordenadas estan en rangos validos (-90/90 lat, -180/180 lng). No usar ubicacion para decisiones de seguridad (solo UX) |
| Tile server de Leaflet comprometido | Info Disclosure | BAJO | Usar tile server de OpenStreetMap via HTTPS. Configurar CSP para img-src solo dominios de tiles conocidos |

### 1.6 Componente: Push Notifications (Expo)

| Amenaza | Tipo STRIDE | Riesgo | Mitigacion |
|---------|-------------|--------|------------|
| Push token robado permite enviar notificaciones falsas | Spoofing | MEDIO | Push tokens se envian solo via Expo Push API (server-side). Nunca exponer push token al cliente de otro usuario |
| Spam de notificaciones | DoS | MEDIO | Rate limiting server-side: max 10 push / hora por usuario. Respetar preferencias de notificacion del usuario |
| Datos sensibles en notificacion push | Info Disclosure | ALTO | Notificaciones contienen SOLO: "Recordatorio de vacuna para [nombre_mascota]". NUNCA incluir datos medicos, nombres de medicamentos, ni condiciones en el body de la notificacion |

### 1.7 Componente: API Backend (Hono en VPS Oracle Cloud)

| Amenaza | Tipo STRIDE | Riesgo | Mitigacion |
|---------|-------------|--------|------------|
| SSRF via endpoints que hacen fetch externo | Injection | ALTO | No hacer fetch a URLs proporcionadas por el usuario. Si es necesario (ej: verificar URL de imagen), whitelist de dominios permitidos |
| DDoS al VPS | DoS | ALTO | Rate limiting global: 100 req/min por IP. Configurar iptables/nftables en el VPS. Considerar Cloudflare como proxy reverso |
| Acceso SSH al VPS comprometido | Elevation | CRITICO | SSH solo con key pair (desactivar password auth). Fail2ban configurado. Puerto SSH no-standard (no 22). Firewall Oracle Cloud: solo puertos 80, 443, SSH custom |
| Base de datos expuesta a internet | Info Disclosure | CRITICO | PostgreSQL escucha SOLO en 127.0.0.1 (localhost). Acceso externo solo via SSH tunnel. pg_hba.conf: solo conexiones locales |
| Secrets hardcodeados en codigo | Info Disclosure | CRITICO | Usar .env (no commitear). Variables: DATABASE_URL, JWT_SECRET, BETTER_AUTH_SECRET, EXPO_PUSH_TOKEN. .env en .gitignore |
| Source maps accesibles en produccion | Info Disclosure | MEDIO | Verificar que *.map files NO sean servidos por el backend. Agregar regla en nginx para bloquear *.map |

### 1.8 Componente: Base de Datos (PostgreSQL en VPS)

| Amenaza | Tipo STRIDE | Riesgo | Mitigacion |
|---------|-------------|--------|------------|
| SQL Injection | Injection | CRITICO | Drizzle ORM usa queries parametrizadas por default. PROHIBIDO usar sql.raw() con input del usuario. Si es necesario raw SQL, usar sql`...` con placeholders |
| Backup no cifrado | Info Disclosure | ALTO | pg_dump con cifrado GPG. Backups automaticos diarios. Almacenar en ubicacion separada del VPS |
| Datos medicos en texto plano | Info Disclosure | CRITICO | Cifrado AES-256-GCM a nivel de columna para: allergies, medical_conditions, current_medication (ver seccion 4) |
| Conexion DB sin SSL | Info Disclosure | MEDIO | Aunque DB es local (localhost), configurar SSL para conexiones si se habilita acceso remoto en el futuro |

---

## 2. Headers de Seguridad

### 2.1 Headers para API Backend (Hono)

```typescript
// Middleware de seguridad para Hono
import { Hono } from 'hono';

const app = new Hono();

app.use('*', async (c, next) => {
  await next();
  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '0'); // Desactivado — CSP es mejor; el header legacy puede causar vulnerabilidades
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header('Cache-Control', 'no-store'); // Default para API responses
  c.header('X-DNS-Prefetch-Control', 'off');
});
```

### 2.2 CORS (restrictivo)

```typescript
import { cors } from 'hono/cors';

app.use('*', cors({
  origin: [
    'http://localhost:8081',  // Expo dev
    // Produccion: solo dominios conocidos si hay web client
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600, // 10 min preflight cache
}));
```

Nota: React Native no usa CORS (las peticiones son nativas, no del browser). CORS es relevante si se agrega un web client en el futuro o para proteger contra uso indebido desde browsers.

### 2.3 nginx headers (VPS)

```nginx
# /etc/nginx/conf.d/security-headers.conf
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# Bloquear source maps
location ~* \.map$ {
  return 404;
}
```

---

## 3. Checklist OWASP Top 10

### A01: Broken Access Control -- APLICA (CRITICO)
- [x] RBAC con 4 roles: Dueno, Veterinario, Organizacion, Admin
- [x] Middleware de Hono valida rol Y ownership en cada endpoint
- [x] IDOR: usar UUIDs v4, validar ownership server-side
- [x] Veterinario solo puede ver mascotas de clientes vinculados
- [x] Admin no puede ver datos medicos cifrados (solo metadata)
- [x] Endpoints de escritura medica requieren rol Veterinario
- Mitigacion: Middleware `requireRole('veterinario')` + `requireOwnership(pet)` en Hono

### A02: Cryptographic Failures -- APLICA (CRITICO)
- [x] HTTPS obligatorio (Let's Encrypt en VPS via nginx)
- [x] Cifrado AES-256-GCM para datos medicos sensibles (ver seccion 4)
- [x] JWT_SECRET minimo 256 bits, generado con crypto.randomBytes(32)
- [x] Passwords hasheados con bcrypt/argon2 (Better Auth lo maneja)
- [x] Nunca secrets en codigo fuente, logs, ni error messages
- [x] .env en .gitignore, .env.example sin valores reales
- Mitigacion: Verificar HTTPS end-to-end, cifrado de columnas, key rotation plan

### A03: Injection -- APLICA (ALTO)
- [x] Drizzle ORM: queries parametrizadas por default
- [x] PROHIBIDO sql.raw() con user input
- [x] Validacion con Zod en TODOS los endpoints (schemas estrictos)
- [x] Busqueda de veterinarios: sanitizar input (max 100 chars, regex whitelist)
- [x] Nombres de mascotas: max 50 chars, alfanumerico + espacios + acentos
- Mitigacion: Zod schemas para cada endpoint + Drizzle parametrizado

### A04: Insecure Design -- APLICA (ALTO)
- [x] Threat model STRIDE antes de implementar (este documento)
- [x] Separacion de concerns: datos publicos (QR) vs datos privados (historial)
- [x] Principio de minimo privilegio: cada rol ve solo lo necesario
- [x] Link temporal con JWT firmado y expiracion de 24h
- Mitigacion: Revisar este threat model antes de cada sprint

### A05: Security Misconfiguration -- APLICA (ALTO)
- [x] Headers de seguridad en API y nginx (ver seccion 2)
- [x] CORS restrictivo (no wildcard *)
- [x] PostgreSQL solo escucha en localhost
- [x] SSH hardening: key-only, puerto custom, fail2ban
- [x] Source maps no accesibles en produccion
- [x] Debug mode desactivado en produccion (NODE_ENV=production)
- [x] Expo: no publicar con --public-url sin verificar
- Mitigacion: Checklist de deploy que verifica cada item

### A06: Vulnerable and Outdated Components -- APLICA (MEDIO)
- [x] `npm audit` en CI/CD antes de cada deploy
- [x] `npx lockfile-lint --allowed-hosts npm --allowed-schemes https: --type npm --path package-lock.json`
- [x] Dependabot o Renovate configurado en GitHub
- [x] Pinear versiones criticas (hono, drizzle, better-auth) en package.json
- Mitigacion: Audit semanal + lockfile-lint en CI

### A07: Identification and Authentication Failures -- APLICA (CRITICO)
- [x] Rate limiting en login: 5 intentos / 15 min por IP
- [x] Account lockout: 30 min tras 10 fallos consecutivos
- [x] Refresh token rotation con deteccion de reuso
- [x] Password policy: minimo 8 chars, al menos 1 mayuscula, 1 numero
- [x] Verificacion de email obligatoria
- [x] Tokens almacenados en SecureStore (no AsyncStorage)
- [x] Logout invalida refresh token en DB
- Mitigacion: Better Auth maneja la mayoria; agregar rate limiting custom en Hono

### A08: Software and Data Integrity Failures -- APLICA (MEDIO)
- [x] Audit trail para cambios en registros medicos
- [x] Verificar integridad de updates de la app (Expo Updates con firma)
- [x] GitHub Actions pinned a SHA (no tags mutables)
- [x] lockfile-lint para prevenir supply-chain attacks
- Mitigacion: audit_log table + signed updates

### A09: Security Logging and Monitoring Failures -- APLICA (ALTO)
- [x] Logear: login exitoso/fallido, cambios de rol, acceso a datos medicos, creacion/modificacion de registros
- [x] NUNCA logear: passwords, tokens, datos medicos (alergias, condiciones, medicacion)
- [x] Formato estructurado (JSON) para parseo automatizado
- [x] Retener logs minimo 90 dias
- [x] Alertas para: 10+ login fallidos en 5 min, acceso a Admin panel, cambios de rol
- Mitigacion: Logger middleware en Hono + tabla security_events en DB

### A10: Server-Side Request Forgery (SSRF) -- APLICA (MEDIO)
- [x] No fetch a URLs del usuario en el backend
- [x] Si se implementa upload de imagenes: validar MIME type server-side, no URL remota
- [x] Whitelist de dominios externos: solo expo.push API, tile servers
- Mitigacion: No implementar funcionalidad de fetch remoto en MVP

---

## 4. Politica de Cifrado

### 4.1 Campos cifrados (AES-256-GCM, application-level)

| Tabla | Campo | Justificacion |
|-------|-------|---------------|
| pets | allergies | Dato medico sensible GDPR/LGPD |
| pets | medical_conditions | Dato medico sensible GDPR/LGPD |
| pets | current_medication | Dato medico sensible GDPR/LGPD |
| medical_records | diagnosis | Detalle clinico |
| medical_records | treatment | Detalle clinico |
| medical_records | notes | Notas del veterinario (pueden contener datos sensibles) |
| users | phone | PII -- dato personal |
| users | address | PII -- dato personal |

### 4.2 Implementacion de cifrado

```typescript
// packages/shared/src/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recomendado para GCM
const TAG_LENGTH = 16; // 128 bits

// ENCRYPTION_KEY viene de env var, 32 bytes (256 bits)
// Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

export function encrypt(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Formato: iv:tag:ciphertext (todo en hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(ciphertext: string, keyHex: string): string {
  const [ivHex, tagHex, encryptedHex] = ciphertext.split(':');
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
```

### 4.3 Key Management

- **ENCRYPTION_KEY**: variable de entorno en el VPS (no en codigo, no en .env del repo)
- **Rotacion**: plan de rotacion semestral. Al rotar: re-cifrar todos los campos con nueva key, mantener old key en env var temporalmente para lectura
- **Backup de key**: almacenar copia cifrada con GPG en ubicacion separada del VPS
- **Separacion**: una key para datos medicos, otra para PII de usuarios (defense in depth)

### 4.4 Campos NO cifrados (no necesitan cifrado a nivel de columna)

- pet.name, pet.species, pet.breed -- datos no sensibles, necesarios para busquedas
- user.email -- necesario para login/busqueda (hashear para lookup si se cifra)
- vaccination_records.vaccine_name, vaccination_records.date -- no sensibles medicamente
- vet.name, vet.clinic_name, vet.address -- datos publicos del directorio

---

## 5. Politica de Rate Limiting

### 5.1 Rate Limits por endpoint

| Endpoint / Grupo | Limite | Ventana | Por | Respuesta al exceder |
|-------------------|--------|---------|-----|----------------------|
| POST /auth/login | 5 req | 15 min | IP | 429 + Retry-After: 900 |
| POST /auth/register | 3 req | 60 min | IP | 429 + Retry-After: 3600 |
| POST /auth/forgot-password | 3 req | 60 min | IP | 429 + Retry-After: 3600 |
| GET /public/pet/:uuid (QR) | 30 req | 1 min | IP | 429 + Retry-After: 60 |
| POST /reviews | 5 req | 60 min | User | 429 + Retry-After: 3600 |
| POST /push/send | 10 req | 60 min | User | 429 |
| API general (autenticado) | 120 req | 1 min | User | 429 + Retry-After: 60 |
| API general (no autenticado) | 30 req | 1 min | IP | 429 + Retry-After: 60 |

### 5.2 Implementacion

```typescript
// Usar @hono-rate-limiter/core o implementar con Map/Redis
// En VPS con single instance, in-memory Map es suficiente para MVP
// Para produccion con multiples instancias: Redis (ver redis-patterns-reference.md)

import { rateLimiter } from 'hono-rate-limiter';

// Login rate limiter
const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 5,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || 'unknown',
  standardHeaders: 'draft-6',
});

app.post('/auth/login', loginLimiter, loginHandler);
```

### 5.3 Account Lockout

- Tras 10 intentos fallidos consecutivos en 1 hora: lockout de 30 min
- Almacenar contador en DB (tabla login_attempts: user_id, attempts, locked_until)
- Reset del contador tras login exitoso
- Admin puede desbloquear manualmente

---

## 6. GDPR/LGPD -- Datos Medicos

### 6.1 Base legal para procesamiento

- **Consentimiento explicito**: el usuario acepta terminos al registrarse que incluyen procesamiento de datos de salud animal
- **Interes legitimo**: veterinarios procesan datos medicos como parte de su servicio profesional

### 6.2 Derechos del usuario (implementar en MVP)

| Derecho | Endpoint | Implementacion |
|---------|----------|----------------|
| Acceso (portabilidad) | GET /me/data-export | Exportar todos los datos del usuario + mascotas en JSON. Cifrado con password del usuario. Disponible en 72h |
| Rectificacion | PUT /me/profile, PUT /pets/:id | El usuario puede editar sus datos y los de sus mascotas |
| Eliminacion (olvido) | DELETE /me/account | Soft delete inmediato + hard delete en 30 dias. Notificar al usuario que los datos medicos se anonimizaran (no eliminaran) para integridad del historial del veterinario |
| Consentimiento | POST /me/consent | Registrar fecha, version de terminos, IP. Almacenar en tabla consents |

### 6.3 Retenciones

| Dato | Retencion | Justificacion |
|------|-----------|---------------|
| Cuenta activa | Indefinida | Mientras el usuario la mantenga |
| Cuenta eliminada -- datos personales | 30 dias | Grace period para recuperacion |
| Cuenta eliminada -- datos medicos | Anonimizados, indefinidos | Integridad del historial veterinario |
| Logs de seguridad | 1 anio | Compliance y auditorias |
| Backups con datos personales | 90 dias max | Rotar backups antiguos |

### 6.4 Anonimizacion

Al eliminar una cuenta:
1. Reemplazar user.email con `deleted-{uuid}@anon.local`
2. Eliminar user.phone, user.address
3. Mantener registros medicos con `owner_id = null` y `owner_name = "[eliminado]"`
4. Mantener vacunaciones (dato de salud publica animal)
5. Eliminar push_tokens, sessions, refresh_tokens

### 6.5 Consentimiento para datos medicos

- Pantalla de consentimiento separada al agregar primera mascota
- Texto claro: "VetConnect almacena datos de salud de tu mascota de forma cifrada. Solo tu y los veterinarios que autorices pueden accederlos."
- Registro en tabla `consents` con: user_id, consent_type, version, granted_at, ip_address

---

## 7. Reglas de Validacion de Input

### 7.1 Schemas Zod criticos

```typescript
// packages/shared/src/validators.ts
import { z } from 'zod';

// Auth
export const loginSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z.string().min(8).max(128),
});

export const registerSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Debe contener al menos una mayuscula')
    .regex(/[0-9]/, 'Debe contener al menos un numero'),
  name: z.string().min(2).max(100).trim(),
  role: z.enum(['owner', 'veterinarian', 'rescue_org']),
  // Admin no se puede auto-registrar
});

// Mascotas
export const petSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'reptile', 'other']),
  breed: z.string().max(100).trim().optional(),
  birth_date: z.string().date().optional(),
  weight_kg: z.number().min(0.01).max(500).optional(),
  allergies: z.string().max(2000).trim().optional(), // Se cifra antes de guardar
  medical_conditions: z.string().max(2000).trim().optional(), // Se cifra
  current_medication: z.string().max(2000).trim().optional(), // Se cifra
});

// Busqueda veterinarios
export const vetSearchSchema = z.object({
  query: z.string().max(100).trim().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radius_km: z.number().min(1).max(100).default(10),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

// Resenas
export const reviewSchema = z.object({
  vet_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000).trim(),
});

// Vacunacion
export const vaccinationSchema = z.object({
  pet_id: z.string().uuid(),
  vaccine_name: z.string().min(2).max(200).trim(),
  date_administered: z.string().date(),
  next_due_date: z.string().date().optional(),
  batch_number: z.string().max(50).trim().optional(),
  veterinarian_id: z.string().uuid(),
  notes: z.string().max(500).trim().optional(), // Se cifra
});
```

### 7.2 Reglas generales

- Todo input del usuario es malicioso hasta que se valide con Zod
- Validacion server-side es OBLIGATORIA; client-side es UX (no seguridad)
- Whitelist de valores (enums) sobre blacklist
- Max length en TODOS los campos string (prevenir DoS por payloads enormes)
- Trim whitespace en todos los strings
- Email: normalizar a lowercase
- UUIDs: validar formato antes de usar en queries
- Archivos (si se implementa upload): validar MIME type server-side, max 5MB, solo image/jpeg, image/png, image/webp

---

## 8. Seguridad Mobile-Specific (React Native + Expo)

### 8.1 Storage seguro
- **SecureStore** para: access token, refresh token
- **NUNCA AsyncStorage** para tokens o datos sensibles
- AsyncStorage es aceptable para: preferencias de UI, cache no sensible

### 8.2 Certificate Pinning (recomendado post-MVP)
- Pinear certificado del VPS en la app para prevenir MITM
- Expo no lo soporta nativamente; usar `expo-certificate-pinning` o `react-native-ssl-pinning`

### 8.3 Ofuscacion
- ProGuard para Android build (habilitado por default en release builds de Expo)
- No incluir API keys en el bundle de la app (todas las keys deben estar server-side)

### 8.4 Deep Links
- Validar esquema de deep link: solo `vetconnect://` y `https://vetconnect.app/`
- Sanitizar parametros de deep links antes de usar

### 8.5 Biometria (recomendado post-MVP)
- `expo-local-authentication` para Face ID / fingerprint como segundo factor opcional
- No reemplaza password; complementa

---

## 9. Recomendaciones CI/CD (para orquestador)

- **GitHub Actions pinned a SHA**: `uses: actions/checkout@8e8c483...` (tags son mutables)
- **CodeQL SAST**: `github/codeql-action/analyze@v3` para deteccion automatica de SQL injection, XSS, path traversal
- **lockfile-lint** en CI: `npx lockfile-lint --allowed-hosts npm --allowed-schemes https: --type npm --path package-lock.json`
- **npm audit** como gate: fallar CI si hay vulnerabilidades high/critical
- **Source maps**: verificar que *.map no sean accesibles via HTTP en produccion

---

## 10. Audit Trail (tabla security_events)

```sql
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL, -- 'login_success', 'login_failure', 'role_change', 'medical_record_access', 'data_export', 'account_deletion'
  actor_id UUID REFERENCES users(id),
  target_id UUID, -- pet_id, user_id, etc.
  target_type VARCHAR(30), -- 'user', 'pet', 'medical_record', 'vaccination'
  ip_address INET,
  user_agent TEXT,
  metadata JSONB, -- detalles adicionales (sin datos sensibles)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_events_actor ON security_events(actor_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_created ON security_events(created_at);
```

---

## Resumen de amenazas por severidad

| Severidad | Cantidad | Componentes principales |
|-----------|----------|------------------------|
| CRITICO | 8 | Auth (escalacion, JWT), Datos medicos (acceso, cifrado), DB (exposure, SQLi), VPS (SSH) |
| ALTO | 9 | Rate limiting, IDOR, logs, SSRF, push data, backups |
| MEDIO | 7 | Enumeracion, QR scraping, resenas falsas, GPS, supply chain |
| BAJO | 2 | Tile server, GPS spoofing |

Total amenazas identificadas: 26
