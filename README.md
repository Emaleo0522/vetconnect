# VetConnect Global

Plataforma de salud y bienestar animal. Conecta duenos de mascotas con veterinarios y organizaciones de rescate.

## Estado del proyecto

| Componente | Estado | Detalle |
|-----------|--------|---------|
| Backend API | COMPLETO | Hono + Drizzle + PostgreSQL, 30+ endpoints, Better Auth, AES-256-GCM |
| Web App | EN PROGRESO | Next.js 16 + shadcn/ui, auth funciona, paginas pendientes |
| Mobile App | COMPLETO (pausado) | Expo SDK 54, preservado para cuando el proyecto escale |
| Base de datos | COMPLETO | PostgreSQL en Oracle Cloud VPS, 15 tablas, seed data |
| Branding | COMPLETO | Logo SVG, paleta, tipografia, imagenes hero |

## Stack

| Capa | Tecnologia |
|------|-----------|
| Web frontend | Next.js 16 + Tailwind CSS + shadcn/ui |
| Mobile (futuro) | React Native + Expo SDK 54 + NativeWind |
| Backend | Hono (Node.js) |
| Base de datos | PostgreSQL 12 + Drizzle ORM |
| Auth | Better Auth (4 roles: owner, vet, org, admin) |
| Validacion | Zod (schemas compartidos) |
| Mapas | Leaflet (open source) |
| State | Zustand |

## Estructura del monorepo

```
vetconnect/
├── apps/
│   ├── api/          # Backend API (Hono + Drizzle)
│   ├── web/          # Web frontend (Next.js + shadcn/ui) ← EN PROGRESO
│   └── mobile/       # Mobile app (Expo) — pausado
├── packages/
│   └── shared/       # Zod validators + TypeScript types
└── assets/
    ├── brand/        # Logo SVGs, brand.json
    └── images/       # Hero, onboarding
```

## Lo que esta hecho

### Backend API (apps/api/)
- **Auth**: Registro por rol (owner/vet/org), login, JWT + refresh tokens, middleware de roles
- **Mascotas**: CRUD completo, historial medico, QR publico, vinculacion vet cabecera
- **Directorio Vet**: Busqueda con filtros (especialidad, distancia Haversine, guardia 24h, texto), paginacion cursor
- **Resenas**: CRUD con constraint 1 resena por vet por usuario, rating promedio
- **Horarios**: CRUD por dia de semana, toggle guardia 24h
- **Vacunas**: CRUD vacunas y tratamientos, link temporal compartible (JWT 24h)
- **Notificaciones**: CRUD, push tokens, job de alertas de vacunas (cada 24h)
- **Seguridad**: AES-256-GCM para datos sensibles, rate limiting, CORS, security headers, XSS sanitize

### Web App (apps/web/) — EN PROGRESO
- **Completado**: Setup Next.js + shadcn/ui, login/registro funcional, layout dashboard con sidebar responsive
- **Pendiente**: Dashboard con datos reales, CRUD mascotas, directorio vets con mapa Leaflet, perfil editable, notificaciones

### Base de datos
- 15 tablas: users, sessions, accounts, verifications, jwks, vet_profiles, org_profiles, pets, medical_records, vaccinations, treatments, reviews, schedules, notifications, push_tokens
- Seed data: 5 usuarios, 5 mascotas, 6 vacunas, 3 vets con horarios, 3 resenas

## Lo que falta hacer

### Prioridad 1: Paginas web funcionales
1. `dashboard/page.tsx` — Stats, mascotas, vacunas proximas, vets cercanos
2. `dashboard/pets/` — Lista, crear, detalle (con tabs: info, historial, vacunas, QR)
3. `dashboard/vets/` — Directorio con filtros + mapa Leaflet, perfil con resenas
4. `dashboard/profile/` — Editable por rol
5. `dashboard/notifications/` — Lista con mark as read
6. `dashboard/vaccinations/` — Cartilla vacunatoria

### Prioridad 2: Deploy
1. Deploy API al VPS (nginx reverse proxy + PM2)
2. Deploy web a Netlify
3. Configurar dominio si hay

### Prioridad 3: Polish
1. Imagenes reales de mascotas/vets en las cards
2. Dark mode
3. i18n (espanol/ingles)
4. SEO basico

## Setup local

### Requisitos
- Node.js >= 20
- PostgreSQL (o SSH tunnel al VPS)

### Instalacion
```bash
git clone https://github.com/Emaleo0522/vetconnect.git
cd vetconnect
npm install
```

### Variables de entorno
```bash
cp apps/api/.env.example apps/api/.env
# Editar con credenciales reales
```

### SSH tunnel para DB (si usas el VPS)
```bash
ssh -f -N -L 5432:localhost:5432 -i "PATH_TO_SSH_KEY" ubuntu@161.153.203.83
```

### Levantar API
```bash
cd apps/api
npm run dev    # Puerto 3001
```

### Seed data
```bash
# Con la API corriendo en puerto 3001:
cd apps/api
npm run seed
```

### Levantar Web
```bash
cd apps/web
npm run dev    # Puerto 3000
```

### Credenciales de prueba
| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| Maria Garcia | maria@example.com | Test1234! | Owner |
| Carlos Lopez | carlos@example.com | Test1234! | Owner |
| Dr. Ana Rodriguez | ana.vet@example.com | Test1234! | Vet (24h) |
| Dr. Pablo Fernandez | pablo.vet@example.com | Test1234! | Vet |
| Dra. Laura Martinez | laura.vet@example.com | Test1234! | Vet (24h) |

## Auditoria

- API testing: 22/27 endpoints PASS (3 bugs criticos corregidos)
- Code quality: TypeScript limpio, seguridad OK, dependencias OK
- Spec de seguridad: STRIDE + OWASP Top 10 en `.pipeline/security-spec.md`

## Documentacion

- Spec original: `VetConnect_Global_Documentacion.pdf` (9 paginas)
- Tareas desglosadas: `.pipeline/tareas.md` (28 tareas)
- Security spec: `.pipeline/security-spec.md`
- Brand: `assets/brand/brand.json`
