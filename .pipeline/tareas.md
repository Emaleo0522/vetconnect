# Tareas — VetConnect Global
Fecha: 2026-04-10
Total: 28 tareas | Tiempo estimado: ~21 horas (28 x 45 min aprox)
Stack: React Native + Expo SDK 52+ / NativeWind 4 / Expo Router | Hono + Drizzle + PostgreSQL | Better Auth (4 roles) | Zustand + TanStack Query | Zod
Estructura: monorepo (apps/mobile, apps/api, packages/shared)

## Gaps identificados
1. **Push notifications**: la spec menciona "recordatorios automaticos" de vacunas pero no especifica el servicio de push (Expo Push Notifications, Firebase FCM, OneSignal). Asumire Expo Push Notifications por ser nativo del stack.
2. **Mensajeria interna**: el modulo 3 menciona "mensajeria interna" como opcion de contacto pero no hay un modulo de chat dedicado. Se implementara como enlace profundo a WhatsApp + llamada telefonica. La mensajeria interna queda fuera del MVP salvo que el orquestador indique lo contrario.
3. **Generacion de QR**: no se especifica si el QR debe ser estatico (URL fija) o dinamico. Asumire QR estatico con URL publica a la ficha medica (read-only, sin auth).
4. **Ubicacion del usuario**: el directorio veterinario filtra por distancia, pero no se especifica si se usa GPS del dispositivo o direccion manual. Asumire GPS con fallback a direccion manual.
5. **Encriptacion en reposo**: la spec dice "encriptacion de datos sensibles en reposo". Esto aplica a nivel de columna (application-level) o a nivel de disco (DB-level). Asumire cifrado a nivel de columna para campos sensibles (alergias, condiciones medicas) con pgcrypto o aes-256 en la app.

---

## Tareas de configuracion

### T01: Setup monorepo con workspaces
Tipo: config
Agente: backend-architect
Descripcion: Inicializar monorepo con npm/pnpm workspaces. Crear estructura `apps/mobile`, `apps/api`, `packages/shared`. Configurar `tsconfig.base.json`, scripts root (`dev`, `build`, `lint`). Agregar `.gitignore`, `.env.example` con todas las variables necesarias.
Archivos esperados:
- `package.json` (root)
- `tsconfig.base.json`
- `apps/mobile/` (vacio, se inicializa en T02)
- `apps/api/` (vacio, se inicializa en T03)
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `.gitignore`
- `.env.example`
Criterio de aceptacion:
- [ ] `npm install` (o pnpm) desde root instala deps de todos los workspaces
- [ ] TypeScript compila sin errores desde root
- [ ] packages/shared es importable desde apps/mobile y apps/api
Dependencias: ninguna

### T02: Setup app mobile (Expo + NativeWind + Expo Router)
Tipo: frontend
Agente: mobile-developer
Descripcion: Inicializar app Expo SDK 52+ con TypeScript en `apps/mobile`. Configurar NativeWind 4, Expo Router (file-based routing), estructura de carpetas (`app/`, `components/`, `hooks/`, `stores/`, `lib/`, `constants/`). Instalar y configurar Zustand, TanStack Query, Zod. Pantalla placeholder "VetConnect" para verificar que todo funciona.
Archivos esperados:
- `apps/mobile/package.json`
- `apps/mobile/app.json`
- `apps/mobile/tsconfig.json`
- `apps/mobile/tailwind.config.ts`
- `apps/mobile/app/_layout.tsx`
- `apps/mobile/app/index.tsx`
- `apps/mobile/lib/api.ts` (cliente HTTP base)
- `apps/mobile/lib/queryClient.ts`
- `apps/mobile/stores/` (directorio)
Criterio de aceptacion:
- [ ] `npx expo start` arranca sin errores
- [ ] NativeWind aplica estilos Tailwind correctamente
- [ ] Expo Router navega a la pantalla placeholder
- [ ] TanStack Query provider envuelve la app
Dependencias: T01

### T03: Setup API backend (Hono + Drizzle + PostgreSQL)
Tipo: backend
Agente: backend-architect
Descripcion: Inicializar servidor Hono en `apps/api` con TypeScript. Configurar Drizzle ORM con driver `postgres.js` apuntando a PostgreSQL (Oracle Cloud VPS). Estructura de carpetas: `src/routes/`, `src/middleware/`, `src/db/`, `src/lib/`, `src/validators/`. Script de migracion. CORS configurado para desarrollo.
Archivos esperados:
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/src/index.ts` (entry point Hono)
- `apps/api/src/db/client.ts` (conexion Drizzle)
- `apps/api/src/db/schema/index.ts`
- `apps/api/src/middleware/cors.ts`
- `apps/api/drizzle.config.ts`
Criterio de aceptacion:
- [ ] `npm run dev` arranca el servidor en puerto 3001
- [ ] GET `/health` retorna `{ status: "ok" }`
- [ ] Drizzle se conecta a PostgreSQL sin errores
- [ ] `npm run db:migrate` ejecuta migraciones
Dependencias: T01

### T04: Schema de base de datos — tablas core
Tipo: backend
Agente: backend-architect
Descripcion: Definir schema Drizzle para todas las tablas del MVP. Tablas: `users`, `sessions`, `accounts`, `verifications` (Better Auth), `user_profiles`, `veterinarian_profiles`, `organization_profiles`, `pets`, `pet_medical_records`, `vaccinations`, `treatments`, `veterinary_reviews`, `veterinary_schedules`. Campos sensibles (alergias, condiciones_medicas) con marcador para cifrado. Indices para busquedas frecuentes (pets por owner, vets por especialidad, vets por ubicacion con lat/lng). Relaciones Drizzle definidas.
Archivos esperados:
- `apps/api/src/db/schema/users.ts`
- `apps/api/src/db/schema/pets.ts`
- `apps/api/src/db/schema/veterinarians.ts`
- `apps/api/src/db/schema/vaccinations.ts`
- `apps/api/src/db/schema/reviews.ts`
- `apps/api/src/db/schema/index.ts` (re-exports)
- `packages/shared/src/types/index.ts` (tipos TypeScript compartidos derivados del schema)
Criterio de aceptacion:
- [ ] `npm run db:migrate` crea todas las tablas sin errores
- [ ] Relaciones FK correctas (pet->user, vaccination->pet, review->vet)
- [ ] Indices creados en columnas de busqueda (owner_id, specialty, lat/lng)
- [ ] Tipos compartidos en packages/shared coinciden con el schema
Dependencias: T03

### T05: Configurar Better Auth (4 roles + JWT + refresh tokens)
Tipo: backend
Agente: backend-architect
Descripcion: Integrar Better Auth con Drizzle adapter en Hono. Configurar email/password auth. Implementar sistema de roles con 4 tipos: `owner` (dueno), `vet` (veterinario), `org` (organizacion), `admin`. JWT con refresh tokens. Middleware de autenticacion para rutas protegidas. Middleware de autorizacion por rol. Endpoint de registro con campo `role` que determina el flujo (vet requiere datos extra).
Archivos esperados:
- `apps/api/src/lib/auth.ts` (config Better Auth)
- `apps/api/src/middleware/auth.ts` (middleware JWT + roles)
- `apps/api/src/routes/auth.ts` (mount Better Auth handler)
- `packages/shared/src/types/auth.ts` (tipos de roles, sesion)
Criterio de aceptacion:
- [ ] POST `/api/auth/sign-up/email` crea usuario con role
- [ ] POST `/api/auth/sign-in/email` retorna JWT + refresh token
- [ ] Middleware rechaza requests sin token valido (401)
- [ ] Middleware de rol rechaza acceso no autorizado (403)
- [ ] Refresh token genera nuevo JWT sin re-login
Dependencias: T04

### T06: Validators Zod compartidos
Tipo: fullstack
Agente: backend-architect
Descripcion: Crear schemas Zod en `packages/shared` para validar todos los inputs del MVP: registro de usuario (por rol), CRUD de mascota, vacunacion, resena, busqueda de veterinarios. Exportar tipos TypeScript inferidos. Estos schemas se usan tanto en backend (validacion de requests) como en mobile (validacion de forms).
Archivos esperados:
- `packages/shared/src/validators/auth.ts`
- `packages/shared/src/validators/pets.ts`
- `packages/shared/src/validators/vaccinations.ts`
- `packages/shared/src/validators/reviews.ts`
- `packages/shared/src/validators/veterinarians.ts`
- `packages/shared/src/validators/index.ts`
Criterio de aceptacion:
- [ ] Cada schema valida datos correctos y rechaza datos invalidos
- [ ] Tipos inferidos coinciden con los tipos del DB schema
- [ ] Importable desde apps/mobile y apps/api sin errores
- [ ] Cubren: email format, password min length, matricula pattern, lat/lng ranges, rating 1-5
Dependencias: T04

---

## Modulo 1: Auth y Usuarios

### T07: API — Endpoints de registro por rol
Tipo: backend
Agente: backend-architect
Descripcion: Implementar flujo de registro diferenciado por rol. Dueno: registro basico (nombre, email, password, telefono). Veterinario: registro extendido (+ matricula, especialidades[], direccion clinica, lat/lng, telefono clinica). Organizacion: registro con datos de org (nombre org, tipo, direccion, sitio web). Admin: solo creable por otro admin. Validacion con Zod schemas de T06. Tras registro exitoso, crear el perfil correspondiente en la tabla de perfil del rol.
Archivos esperados:
- `apps/api/src/routes/users.ts`
- `apps/api/src/services/user.service.ts`
Criterio de aceptacion:
- [ ] Registro de dueno crea user + user_profile
- [ ] Registro de vet crea user + veterinarian_profile con matricula y especialidades
- [ ] Registro de org crea user + organization_profile
- [ ] Validacion rechaza matricula con formato invalido
- [ ] Email duplicado retorna 409
Dependencias: T05, T06

### T08: API — Perfil editable por rol
Tipo: backend
Agente: backend-architect
Descripcion: Endpoints CRUD para perfil de usuario segun su rol. GET `/api/users/me/profile` retorna perfil completo segun rol. PUT `/api/users/me/profile` actualiza campos permitidos por rol. Foto de perfil: aceptar upload multipart (guardar en filesystem del VPS o S3-compatible). Cada rol solo puede editar SUS propios campos.
Archivos esperados:
- `apps/api/src/routes/profile.ts`
- `apps/api/src/services/profile.service.ts`
- `apps/api/src/lib/upload.ts` (handler de archivos)
Criterio de aceptacion:
- [ ] GET perfil retorna datos completos segun rol del usuario autenticado
- [ ] PUT perfil actualiza solo campos permitidos
- [ ] Upload de foto funciona y retorna URL accesible
- [ ] Un dueno no puede editar campos de veterinario
Dependencias: T07

### T09: Mobile — Pantallas de login y registro
Tipo: frontend
Agente: mobile-developer
Descripcion: Implementar pantallas de autenticacion con Expo Router. Login: email + password, boton login, link a registro. Registro: selector de rol (dueno/vet/org), formulario dinamico segun rol elegido (campos extra para vet y org). Validacion client-side con Zod. Store de auth con Zustand (token, user, role). Persistencia de sesion con SecureStore. Redirecccion automatica si hay sesion activa.
Archivos esperados:
- `apps/mobile/app/(auth)/login.tsx`
- `apps/mobile/app/(auth)/register.tsx`
- `apps/mobile/app/(auth)/_layout.tsx`
- `apps/mobile/stores/authStore.ts`
- `apps/mobile/components/auth/RoleSelector.tsx`
- `apps/mobile/components/auth/VetRegistrationFields.tsx`
- `apps/mobile/components/auth/OrgRegistrationFields.tsx`
Criterio de aceptacion:
- [ ] Login con credenciales validas navega a home
- [ ] Login con credenciales invalidas muestra error
- [ ] Registro muestra campos extra al seleccionar rol vet u org
- [ ] Validacion client-side muestra errores inline antes de enviar
- [ ] Token se persiste en SecureStore y se restaura al reabrir app
- [ ] App redirige a home si hay sesion activa
Dependencias: T05, T06, T02

### T10: Mobile — Pantalla de perfil editable
Tipo: frontend
Agente: mobile-developer
Descripcion: Pantalla de perfil del usuario autenticado. Muestra datos segun rol. Permite editar campos (nombre, telefono, foto, y campos especificos del rol). Foto de perfil con picker de imagen (expo-image-picker). Boton de cerrar sesion.
Archivos esperados:
- `apps/mobile/app/(tabs)/profile.tsx`
- `apps/mobile/components/profile/ProfileForm.tsx`
- `apps/mobile/components/profile/AvatarPicker.tsx`
Criterio de aceptacion:
- [ ] Muestra datos del perfil cargados desde API
- [ ] Permite editar y guardar cambios (feedback de exito/error)
- [ ] Foto de perfil se puede cambiar con picker
- [ ] Cerrar sesion limpia SecureStore y navega a login
Dependencias: T08, T09

---

## Modulo 2: Perfil de Mascota

### T11: API — CRUD de mascotas
Tipo: backend
Agente: backend-architect
Descripcion: Endpoints REST para mascotas vinculadas al dueno autenticado. POST `/api/pets` (crear), GET `/api/pets` (listar del dueno), GET `/api/pets/:id` (detalle), PUT `/api/pets/:id` (actualizar), DELETE `/api/pets/:id` (eliminar). Datos: nombre, foto, especie, raza, fecha_nacimiento, sexo, color, peso, microchip, alergias (cifrado), condiciones_medicas (cifrado), medicacion_actual, vet_cabecera_id. Generar UUID unico por mascota para el QR code. Solo el dueno puede CRUD sus mascotas. Un vet vinculado puede leer (no escribir).
Archivos esperados:
- `apps/api/src/routes/pets.ts`
- `apps/api/src/services/pet.service.ts`
- `apps/api/src/lib/crypto.ts` (cifrado AES-256 para campos sensibles)
Criterio de aceptacion:
- [ ] CRUD completo funciona para dueno autenticado
- [ ] Dueno A no puede ver mascotas de Dueno B (403)
- [ ] Campos alergias y condiciones_medicas se almacenan cifrados en DB
- [ ] UUID de mascota se genera al crear y es unico
- [ ] Vet vinculado como cabecera puede GET la mascota
Dependencias: T05, T06

### T12: API — Historial medico y vinculacion con veterinario
Tipo: backend
Agente: backend-architect
Descripcion: Endpoints para historial medico de mascota. GET `/api/pets/:id/medical-history` retorna consultas, tratamientos y vacunas ordenadas por fecha. POST `/api/pets/:id/medical-records` permite al vet agregar registros (consulta, diagnostico, tratamiento, notas). PUT `/api/pets/:id/vet-link` permite al dueno vincular/desvincular veterinario de cabecera. Endpoint publico GET `/api/pets/qr/:uuid` retorna ficha medica resumida (sin auth, solo lectura, datos no sensibles).
Archivos esperados:
- `apps/api/src/routes/medical.ts`
- `apps/api/src/services/medical.service.ts`
Criterio de aceptacion:
- [ ] Historial retorna registros ordenados por fecha desc
- [ ] Solo vet vinculado o dueno pueden agregar registros
- [ ] Endpoint QR publico retorna nombre, especie, raza, vacunas vigentes (sin alergias ni datos sensibles)
- [ ] Vincular vet actualiza vet_cabecera_id en la mascota
Dependencias: T11

### T13: Mobile — Listado y CRUD de mascotas
Tipo: frontend
Agente: mobile-developer
Descripcion: Pantalla principal de mascotas del dueno. Lista con tarjetas (foto, nombre, especie, raza). Boton "+" para agregar mascota. Formulario de alta/edicion con todos los campos (nombre, foto con picker, especie selector, raza, fecha nacimiento con date picker, sexo, color, peso, microchip). Swipe para eliminar con confirmacion. Pull-to-refresh.
Archivos esperados:
- `apps/mobile/app/(tabs)/pets/index.tsx`
- `apps/mobile/app/(tabs)/pets/[id].tsx`
- `apps/mobile/app/(tabs)/pets/new.tsx`
- `apps/mobile/components/pets/PetCard.tsx`
- `apps/mobile/components/pets/PetForm.tsx`
- `apps/mobile/stores/petStore.ts` (o usar TanStack Query directamente)
Criterio de aceptacion:
- [ ] Lista muestra mascotas del dueno con foto y datos basicos
- [ ] Crear mascota con todos los campos funciona
- [ ] Editar mascota precarga datos actuales
- [ ] Eliminar mascota pide confirmacion
- [ ] Pull-to-refresh recarga la lista
- [ ] Loading skeleton mientras carga
Dependencias: T11, T09

### T14: Mobile — Detalle de mascota + historial medico
Tipo: frontend
Agente: mobile-developer
Descripcion: Pantalla de detalle de mascota con tabs o secciones: Datos generales, Historial medico, Cartilla vacunatoria (placeholder, se llena en T21), QR code. Historial muestra timeline de consultas y tratamientos. Boton para compartir QR code (expo-sharing). Boton para vincular/desvincular veterinario de cabecera (buscador de vets).
Archivos esperados:
- `apps/mobile/app/(tabs)/pets/[id]/index.tsx` (detalle con tabs)
- `apps/mobile/components/pets/PetDetail.tsx`
- `apps/mobile/components/pets/MedicalTimeline.tsx`
- `apps/mobile/components/pets/PetQRCode.tsx`
- `apps/mobile/components/pets/VetLinker.tsx`
Criterio de aceptacion:
- [ ] Detalle muestra todos los datos de la mascota
- [ ] Historial medico muestra timeline cronologica
- [ ] QR code se genera con el UUID de la mascota
- [ ] QR code se puede compartir via share sheet
- [ ] Se puede buscar y vincular un veterinario de cabecera
Dependencias: T12, T13

---

## Modulo 3: Directorio Veterinario

### T15: API — Listado y busqueda de veterinarios
Tipo: backend
Agente: backend-architect
Descripcion: GET `/api/vets` con filtros: especialidad, disponibilidad (guardia 24h), distancia (lat/lng + radio en km usando formula Haversine en SQL), texto libre (nombre, clinica). Paginacion cursor-based. GET `/api/vets/:id` retorna perfil completo con horarios y rating promedio. Ordenar por: distancia, rating, nombre.
Archivos esperados:
- `apps/api/src/routes/vets.ts`
- `apps/api/src/services/vet.service.ts`
Criterio de aceptacion:
- [ ] Listado retorna vets paginados con datos basicos
- [ ] Filtro por especialidad funciona
- [ ] Filtro por distancia calcula correctamente con Haversine
- [ ] Filtro por guardia 24h funciona
- [ ] Perfil individual incluye rating promedio calculado
- [ ] Paginacion cursor-based funciona correctamente
Dependencias: T07

### T16: API — Sistema de valoraciones y resenas
Tipo: backend
Agente: backend-architect
Descripcion: POST `/api/vets/:id/reviews` (crear resena: rating 1-5 + texto, solo duenos). GET `/api/vets/:id/reviews` (listar resenas paginadas). PUT `/api/vets/:id/reviews/:reviewId` (editar propia). DELETE `/api/vets/:id/reviews/:reviewId` (borrar propia o admin). Un dueno solo puede dejar 1 resena por veterinario. Rating promedio se recalcula al crear/editar/borrar.
Archivos esperados:
- `apps/api/src/routes/reviews.ts`
- `apps/api/src/services/review.service.ts`
Criterio de aceptacion:
- [ ] Solo rol dueno puede crear resena
- [ ] Rating validado entre 1 y 5
- [ ] Un dueno no puede crear 2 resenas para el mismo vet (409)
- [ ] Rating promedio del vet se actualiza correctamente
- [ ] Admin puede borrar cualquier resena
Dependencias: T07

### T17: API — Horarios y disponibilidad del veterinario
Tipo: backend
Agente: backend-architect
Descripcion: CRUD de horarios para el veterinario autenticado. PUT `/api/vets/me/schedule` (definir horarios por dia de la semana: hora inicio, hora fin, activo). PUT `/api/vets/me/emergency` (toggle guardia 24h: boolean). GET `/api/vets/:id/schedule` (publico, retorna horarios y si esta de guardia).
Archivos esperados:
- `apps/api/src/routes/schedule.ts`
- `apps/api/src/services/schedule.service.ts`
Criterio de aceptacion:
- [ ] Vet puede definir horario por dia de la semana
- [ ] Toggle guardia 24h funciona
- [ ] Horarios publicos accesibles sin auth
- [ ] Solo el vet puede editar SUS horarios
Dependencias: T07

### T18: Mobile — Directorio veterinario con mapa
Tipo: frontend
Agente: mobile-developer
Descripcion: Pantalla de directorio con dos vistas: lista y mapa. Vista lista: tarjetas con foto, nombre, especialidades, rating, distancia. Vista mapa: react-native-maps con pins por ubicacion de cada vet. Filtros: especialidad (dropdown), distancia (slider), guardia 24h (toggle), busqueda por texto. Geolocalizacion del usuario con expo-location para calcular distancia. Tap en pin o tarjeta navega al perfil del vet.
Archivos esperados:
- `apps/mobile/app/(tabs)/vets/index.tsx`
- `apps/mobile/components/vets/VetCard.tsx`
- `apps/mobile/components/vets/VetMap.tsx`
- `apps/mobile/components/vets/VetFilters.tsx`
- `apps/mobile/hooks/useLocation.ts`
Criterio de aceptacion:
- [ ] Lista y mapa muestran veterinarios correctamente
- [ ] Toggle entre vista lista y mapa funciona
- [ ] Filtros por especialidad, distancia y guardia funcionan
- [ ] Pins en mapa corresponden a ubicaciones reales
- [ ] Geolocalizacion pide permiso y funciona
- [ ] Tap en vet navega a su perfil
Dependencias: T15, T09

### T19: Mobile — Perfil de veterinario + resenas + contacto
Tipo: frontend
Agente: mobile-developer
Descripcion: Pantalla de perfil publico del veterinario. Secciones: foto + datos basicos, especialidades (chips), horarios de atencion (tabla), indicador guardia 24h, rating promedio con estrellas, lista de resenas. Botones de contacto: llamar (Linking.openURL tel:), WhatsApp (deep link), abrir en mapa (deep link a Google Maps/Waze). Formulario para dejar resena (solo si rol dueno y no tiene resena previa).
Archivos esperados:
- `apps/mobile/app/(tabs)/vets/[id].tsx`
- `apps/mobile/components/vets/VetProfile.tsx`
- `apps/mobile/components/vets/ReviewList.tsx`
- `apps/mobile/components/vets/ReviewForm.tsx`
- `apps/mobile/components/vets/ContactButtons.tsx`
- `apps/mobile/components/vets/ScheduleTable.tsx`
Criterio de aceptacion:
- [ ] Perfil muestra todos los datos del vet
- [ ] Estrellas muestran rating promedio correcto
- [ ] Resenas se listan con paginacion
- [ ] Boton llamar abre el dialer
- [ ] Boton WhatsApp abre WhatsApp con numero prellenado
- [ ] Formulario de resena aparece solo para duenos sin resena previa
- [ ] Tras enviar resena, se actualiza la lista y el rating
Dependencias: T15, T16, T17, T18

---

## Modulo 4: Cartilla Vacunatoria Digital

### T20: API — CRUD de vacunas y tratamientos
Tipo: backend
Agente: backend-architect
Descripcion: Endpoints para cartilla vacunatoria. POST `/api/pets/:id/vaccinations` (registrar vacuna: nombre, fecha, vet aplicador, lote, proxima_dosis). GET `/api/pets/:id/vaccinations` (listar vacunas). POST `/api/pets/:id/treatments` (registrar desparasitacion, cirugia u otro tratamiento). GET `/api/pets/:id/treatments` (listar tratamientos). Solo dueno de la mascota o vet vinculado pueden crear registros. Compartir cartilla: GET `/api/pets/:id/vaccination-card?token=X` (link temporal con token JWT de 24h).
Archivos esperados:
- `apps/api/src/routes/vaccinations.ts`
- `apps/api/src/services/vaccination.service.ts`
- `apps/api/src/routes/treatments.ts`
- `apps/api/src/services/treatment.service.ts`
Criterio de aceptacion:
- [ ] CRUD vacunas funciona para dueno y vet vinculado
- [ ] CRUD tratamientos funciona para dueno y vet vinculado
- [ ] Otro usuario sin vinculacion recibe 403
- [ ] Link temporal de cartilla expira en 24h
- [ ] Datos ordenados por fecha descendente
Dependencias: T11

### T21: API — Alertas y recordatorios de vacunas
Tipo: backend
Agente: backend-architect
Descripcion: Job programado (cron via setInterval en Hono o node-cron) que corre 1x al dia. Busca vacunas con proxima_dosis en los proximos 7 dias. Genera notificacion push via Expo Push Notifications API. Tambien genera alertas segun especie y edad del animal (ej: cachorro < 1 anio necesita refuerzo cada 3 semanas). Endpoint GET `/api/notifications` para listar notificaciones del usuario. Endpoint PUT `/api/notifications/:id/read` para marcar como leida.
Archivos esperados:
- `apps/api/src/jobs/vaccination-alerts.ts`
- `apps/api/src/services/notification.service.ts`
- `apps/api/src/routes/notifications.ts`
- `apps/api/src/lib/push.ts` (wrapper Expo Push API)
Criterio de aceptacion:
- [ ] Job identifica vacunas proximas a vencer correctamente
- [ ] Push notification se envia al dispositivo del dueno
- [ ] Alertas por especie/edad se generan segun reglas basicas (perro cachorro, gato adulto, etc.)
- [ ] Endpoint lista notificaciones del usuario autenticado
- [ ] Marcar como leida funciona
Dependencias: T20

### T22: Mobile — Cartilla vacunatoria
Tipo: frontend
Agente: mobile-developer
Descripcion: Pantalla de cartilla vacunatoria dentro del detalle de mascota. Lista de vacunas con: nombre, fecha, veterinario, estado (vigente/proxima/vencida con colores). Lista de tratamientos (desparasitaciones, cirugias). Formulario para agregar vacuna/tratamiento. Indicadores visuales: verde (vigente), amarillo (proxima en 7 dias), rojo (vencida). Boton para compartir cartilla (genera link temporal y lo comparte).
Archivos esperados:
- `apps/mobile/app/(tabs)/pets/[id]/vaccinations.tsx`
- `apps/mobile/components/vaccinations/VaccinationList.tsx`
- `apps/mobile/components/vaccinations/VaccinationForm.tsx`
- `apps/mobile/components/vaccinations/TreatmentList.tsx`
- `apps/mobile/components/vaccinations/TreatmentForm.tsx`
- `apps/mobile/components/vaccinations/ShareCardButton.tsx`
Criterio de aceptacion:
- [ ] Lista muestra vacunas con indicador de estado por color
- [ ] Agregar vacuna funciona con date picker para proxima dosis
- [ ] Agregar tratamiento funciona con tipo seleccionable
- [ ] Compartir genera link y abre share sheet
- [ ] Pull-to-refresh recarga la lista
Dependencias: T20, T14

### T23: Mobile — Centro de notificaciones
Tipo: frontend
Agente: mobile-developer
Descripcion: Pantalla de notificaciones accesible desde header (icono campana con badge de no leidas). Lista de notificaciones: texto, fecha, estado leida/no leida. Tap marca como leida. Tap en notificacion de vacuna navega a la cartilla de la mascota correspondiente. Configurar expo-notifications para recibir push y registrar push token en el backend.
Archivos esperados:
- `apps/mobile/app/(tabs)/notifications.tsx`
- `apps/mobile/components/notifications/NotificationItem.tsx`
- `apps/mobile/components/notifications/NotificationBadge.tsx`
- `apps/mobile/hooks/usePushNotifications.ts`
- `apps/mobile/lib/notifications.ts` (registro de push token)
Criterio de aceptacion:
- [ ] Badge muestra cantidad de no leidas
- [ ] Lista muestra notificaciones ordenadas por fecha
- [ ] Tap marca como leida y actualiza badge
- [ ] Tap en notificacion de vacuna navega a la cartilla
- [ ] Push token se registra en el backend al iniciar la app
- [ ] Push notification recibida en foreground muestra alerta
Dependencias: T21, T09

---

## Tareas de integracion

### T24: Mobile — Tab navigator y navegacion global
Tipo: frontend
Agente: mobile-developer
Descripcion: Configurar Expo Router con tab navigator principal: Inicio (resumen), Mascotas, Veterinarios, Notificaciones, Perfil. Navegacion condicional por rol (dueno ve Mascotas, vet ve "Mis pacientes", org ve "Rescates"). Header global con logo y badge de notificaciones. Splash screen con branding VetConnect.
Archivos esperados:
- `apps/mobile/app/(tabs)/_layout.tsx`
- `apps/mobile/app/(tabs)/index.tsx` (home/dashboard)
- `apps/mobile/components/layout/TabBar.tsx` (custom si aplica)
- `apps/mobile/components/layout/Header.tsx`
Criterio de aceptacion:
- [ ] 5 tabs visibles y navegables
- [ ] Tabs cambian segun rol del usuario
- [ ] Badge de notificaciones visible en tab
- [ ] Splash screen aparece al cargar
- [ ] Navegacion fluida entre todas las pantallas
Dependencias: T09, T10, T13, T18, T23

### T25: Mobile — Dashboard / Home por rol
Tipo: frontend
Agente: mobile-developer
Descripcion: Pantalla de inicio personalizada por rol. Dueno: resumen de mascotas (cards), proximas vacunas, vet de cabecera. Veterinario: pacientes vinculados, resenas recientes, completar horarios. Organizacion: placeholder "Proximimamente". Admin: placeholder "Panel admin". Accesos rapidos a las secciones mas usadas.
Archivos esperados:
- `apps/mobile/app/(tabs)/index.tsx`
- `apps/mobile/components/home/OwnerDashboard.tsx`
- `apps/mobile/components/home/VetDashboard.tsx`
- `apps/mobile/components/home/OrgDashboard.tsx`
Criterio de aceptacion:
- [ ] Dashboard cambia segun rol del usuario autenticado
- [ ] Dueno ve sus mascotas y proximas vacunas
- [ ] Vet ve sus pacientes vinculados
- [ ] Cards son tappeables y navegan a la seccion correspondiente
Dependencias: T24

### T26: Seguridad — Cifrado de datos sensibles + rate limiting
Tipo: backend
Agente: backend-architect
Descripcion: Implementar cifrado AES-256-GCM para campos sensibles (alergias, condiciones_medicas, medicacion_actual) en la capa de servicio (encrypt antes de INSERT, decrypt despues de SELECT). Key derivada de variable de entorno ENCRYPTION_KEY. Rate limiting global (100 req/min por IP) y por endpoint sensible (login: 5 intentos/min). Headers de seguridad (HSTS, X-Content-Type-Options, etc.). Sanitizacion de inputs contra XSS.
Archivos esperados:
- `apps/api/src/lib/crypto.ts` (AES-256-GCM encrypt/decrypt)
- `apps/api/src/middleware/rateLimit.ts`
- `apps/api/src/middleware/security.ts` (headers + sanitizacion)
Criterio de aceptacion:
- [ ] Campos sensibles ilegibles en DB directamente (cifrados)
- [ ] API retorna datos descifrados correctamente al usuario autorizado
- [ ] Rate limit bloquea tras exceder umbral (429)
- [ ] Headers de seguridad presentes en todas las respuestas
- [ ] Input con tags HTML/script se sanitiza
Dependencias: T11, T05

### T27: API — Registro de push tokens
Tipo: backend
Agente: backend-architect
Descripcion: Endpoint POST `/api/push-tokens` para registrar Expo push token del dispositivo. Vincula token al user_id. Endpoint DELETE `/api/push-tokens` para desregistrar al cerrar sesion. El servicio de notificaciones (T21) usa estos tokens para enviar pushes.
Archivos esperados:
- `apps/api/src/routes/pushTokens.ts`
- `apps/api/src/db/schema/pushTokens.ts`
Criterio de aceptacion:
- [ ] Registrar token funciona y se vincula al usuario
- [ ] Mismo token no se duplica (upsert)
- [ ] Desregistrar elimina el token
- [ ] El job de alertas (T21) usa estos tokens correctamente
Dependencias: T05

### T28: Testing manual end-to-end — Flujo completo
Tipo: fullstack
Agente: evidence-collector
Descripcion: Verificar el flujo completo del MVP manualmente. Registrar un dueno. Agregar una mascota con todos los datos. Registrar un vet. Vincular vet como cabecera. Agregar vacunas. Verificar recordatorio generado. Buscar vet en directorio. Dejar resena. Compartir cartilla via QR. Verificar que datos sensibles estan cifrados en DB. Verificar rate limiting. Generar screenshots de cada pantalla.
Archivos esperados:
- `/tmp/qa/vetconnect/` (screenshots)
Criterio de aceptacion:
- [ ] Flujo completo de dueno funciona sin errores
- [ ] Flujo completo de vet funciona sin errores
- [ ] QR code muestra ficha publica correcta
- [ ] Datos cifrados verificados en DB
- [ ] Rate limiting activo
- [ ] Screenshots de todas las pantallas guardadas
Dependencias: T25, T26, T27
