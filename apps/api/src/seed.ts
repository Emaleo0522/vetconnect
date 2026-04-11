import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import * as schema from "./db/schema/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const API_ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://vetconnect:VetC0nnect2026!secure@localhost:5432/vetconnect";
const API_BASE = `http://localhost:${process.env.PORT ?? 3001}`;

// ---------------------------------------------------------------------------
// DB client (standalone — not the app's client, to avoid env.ts validation)
// ---------------------------------------------------------------------------
const sql = postgres(DATABASE_URL, { max: 5, prepare: false });
const db = drizzle(sql, { schema });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Register a user via Better Auth sign-up endpoint. Returns user id. */
async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  image?: string;
}): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": API_BASE,
    },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    // If user already exists, look them up
    if (body.includes("already") || body.includes("exists") || res.status === 422 || res.status === 409) {
      const existing = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.email, data.email))
        .limit(1);
      if (existing.length > 0) {
        console.log(`  -> User ${data.email} already exists (${existing[0].id})`);
        await db
          .update(schema.users)
          .set({
            role: data.role as "owner" | "vet" | "org" | "admin",
            image: data.image ?? null,
            phone: data.phone ?? null,
          })
          .where(eq(schema.users.id, existing[0].id));
        return existing[0].id;
      }
    }
    throw new Error(`Failed to create user ${data.email}: ${res.status} ${body}`);
  }

  const json = (await res.json()) as { user?: { id: string }; id?: string };
  const userId = json.user?.id ?? json.id;
  if (!userId) throw new Error(`No user id returned for ${data.email}`);

  // Better Auth may default role to "owner" — force the role, image, phone we want
  await db
    .update(schema.users)
    .set({
      role: data.role as "owner" | "vet" | "org" | "admin",
      image: data.image ?? null,
      phone: data.phone ?? null,
    })
    .where(eq(schema.users.id, userId));

  console.log(`  -> Created user ${data.email} (${userId}) role=${data.role}`);
  return userId;
}

/** Sleep for ms */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Download an image via curl (shell out). */
function downloadImage(url: string, dest: string): void {
  try {
    execSync(`curl -sL "${url}" -o "${dest}"`, { timeout: 15000 });
  } catch {
    console.warn(`  [WARN] Failed to download ${url}`);
  }
}

// ---------------------------------------------------------------------------
// Cleanup — makes the script idempotent
// ---------------------------------------------------------------------------
async function cleanup() {
  console.log("Cleaning existing seed data...");
  // Order matters due to FK constraints
  await db.delete(schema.veterinaryReviews);
  await db.delete(schema.veterinarySchedules);
  await db.delete(schema.treatments);
  await db.delete(schema.vaccinations);
  await db.delete(schema.medicalRecords);
  await db.delete(schema.pets);
  await db.delete(schema.veterinarianProfiles);
  // Delete seed users by email
  const seedEmails = [
    "maria@example.com",
    "carlos@example.com",
    "ana.vet@example.com",
    "pablo.vet@example.com",
    "laura.vet@example.com",
  ];
  for (const email of seedEmails) {
    const found = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email));
    for (const u of found) {
      await db.delete(schema.sessions).where(eq(schema.sessions.userId, u.id));
      await db.delete(schema.accounts).where(eq(schema.accounts.userId, u.id));
      await db.delete(schema.users).where(eq(schema.users.id, u.id));
    }
  }
  console.log("  -> Cleanup done.");
}

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------
async function seed() {
  console.log("=== Seeding VetConnect database ===\n");

  // -----------------------------------------------------------------------
  // 0. Cleanup
  // -----------------------------------------------------------------------
  await cleanup();

  // -----------------------------------------------------------------------
  // 1. Create users via Better Auth API
  // -----------------------------------------------------------------------
  console.log("\n1. Creating users...");

  const userDefs = [
    { name: "Maria Garcia", email: "maria@example.com", password: "Test1234!", role: "owner", image: "/uploads/avatars/maria.jpg" },
    { name: "Carlos Lopez", email: "carlos@example.com", password: "Test1234!", role: "owner", image: "/uploads/avatars/carlos.jpg" },
    { name: "Dr. Ana Rodriguez", email: "ana.vet@example.com", password: "Test1234!", role: "vet", image: "/uploads/avatars/ana-vet.jpg" },
    { name: "Dr. Pablo Fernandez", email: "pablo.vet@example.com", password: "Test1234!", role: "vet", image: "/uploads/avatars/pablo-vet.jpg" },
    { name: "Dra. Laura Martinez", email: "laura.vet@example.com", password: "Test1234!", role: "vet", image: "/uploads/avatars/laura-vet.jpg" },
  ];

  const userIds: string[] = [];
  for (const def of userDefs) {
    let id: string | null = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        id = await createUser(def);
        break;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("429") || msg.includes("TOO_MANY")) {
          const wait = 5000 * (attempt + 1);
          console.log(`  [RATE LIMITED] Waiting ${wait / 1000}s before retry...`);
          await sleep(wait);
        } else {
          throw err;
        }
      }
    }
    if (!id) throw new Error(`Failed to create user ${def.email} after retries`);
    userIds.push(id);
    await sleep(3000); // Avoid rate limiting from Better Auth
  }
  const [mariaId, carlosId, anaId, pabloId, lauraId] = userIds;

  // -----------------------------------------------------------------------
  // 2. Create vet profiles
  // -----------------------------------------------------------------------
  console.log("\n2. Creating vet profiles...");

  const anaProfileId = nanoid();
  const pabloProfileId = nanoid();
  const lauraProfileId = nanoid();

  await db.insert(schema.veterinarianProfiles).values([
    {
      id: anaProfileId,
      userId: anaId,
      license: "MV-BA-2018-001",
      specialties: ["Medicina general", "Cirugia"],
      clinicName: "Clinica Veterinaria San Martin",
      clinicAddress: "Av. San Martin 1234, CABA",
      clinicPhone: "+54 11 4555-1234",
      latitude: "-34.6037000",
      longitude: "-58.3816000",
      isEmergency24h: true,
      bio: "Veterinaria con 8 anos de experiencia en medicina general y cirugia de pequenos animales.",
    },
    {
      id: pabloProfileId,
      userId: pabloId,
      license: "MV-BA-2019-042",
      specialties: ["Dermatologia", "Cardiologia"],
      clinicName: "Pet Care Center",
      clinicAddress: "Calle Palermo 567, CABA",
      clinicPhone: "+54 11 4777-5678",
      latitude: "-34.5883000",
      longitude: "-58.4009000",
      isEmergency24h: false,
      bio: "Especialista en dermatologia y cardiologia veterinaria. 6 anos de experiencia.",
    },
    {
      id: lauraProfileId,
      userId: lauraId,
      license: "MV-BA-2017-099",
      specialties: ["Traumatologia", "Medicina general"],
      clinicName: "Centro Veterinario del Sur",
      clinicAddress: "Av. Rivadavia 8900, CABA",
      clinicPhone: "+54 11 4600-9012",
      latitude: "-34.6345000",
      longitude: "-58.3700000",
      isEmergency24h: true,
      bio: "Traumatologa veterinaria con atencion de guardia las 24 horas. 9 anos de experiencia.",
    },
  ]);
  console.log("  -> 3 vet profiles created.");

  // -----------------------------------------------------------------------
  // 3. Create pets
  // -----------------------------------------------------------------------
  console.log("\n3. Creating pets...");

  const lunaId = nanoid();
  const miloId = nanoid();
  const rockyId = nanoid();
  const ninaId = nanoid();
  const kiwiId = nanoid();

  await db.insert(schema.pets).values([
    {
      id: lunaId,
      ownerId: mariaId,
      name: "Luna",
      photo: "/uploads/pets/luna.jpg",
      species: "dog",
      breed: "Golden Retriever",
      birthDate: "2023-06-15",
      sex: "female",
      color: "Dorado",
      weight: "28.00",
      microchip: "123456789012345",
      vetId: anaId, // Dr. Ana es su vet de cabecera
      uuid: nanoid(),
    },
    {
      id: miloId,
      ownerId: mariaId,
      name: "Milo",
      photo: "/uploads/pets/milo.jpg",
      species: "cat",
      breed: "Siames",
      birthDate: "2024-01-10",
      sex: "male",
      color: "Blanco/Gris",
      weight: "4.50",
      uuid: nanoid(),
    },
    {
      id: rockyId,
      ownerId: carlosId,
      name: "Rocky",
      photo: "/uploads/pets/rocky.jpg",
      species: "dog",
      breed: "Pastor Aleman",
      birthDate: "2022-03-20",
      sex: "male",
      color: "Negro/Marron",
      weight: "35.00",
      microchip: null,
      vetId: pabloId, // Dr. Pablo es su vet de cabecera
      uuid: nanoid(),
    },
    {
      id: ninaId,
      ownerId: carlosId,
      name: "Nina",
      photo: "/uploads/pets/nina.jpg",
      species: "cat",
      breed: "Persa",
      birthDate: "2023-09-01",
      sex: "female",
      color: "Blanca",
      weight: "3.80",
      uuid: nanoid(),
    },
    {
      id: kiwiId,
      ownerId: carlosId,
      name: "Kiwi",
      photo: "/uploads/pets/kiwi.jpg",
      species: "bird",
      breed: "Cotorra",
      birthDate: "2024-05-15",
      sex: "male",
      color: "Verde",
      weight: "0.30",
      uuid: nanoid(),
    },
  ]);
  console.log("  -> 5 pets created.");

  // -----------------------------------------------------------------------
  // 4. Create vaccinations & treatments
  // -----------------------------------------------------------------------
  console.log("\n4. Creating vaccinations & treatments...");

  await db.insert(schema.vaccinations).values([
    // Luna
    {
      id: nanoid(),
      petId: lunaId,
      name: "Quintuple",
      date: "2025-12-01",
      nextDoseDate: "2026-12-01",
      batch: "QV-2025-001",
      vetId: anaId,
    },
    {
      id: nanoid(),
      petId: lunaId,
      name: "Antirrabica",
      date: "2026-01-15",
      nextDoseDate: "2027-01-15",
      batch: "AR-2026-123",
      vetId: anaId,
    },
    // Rocky
    {
      id: nanoid(),
      petId: rockyId,
      name: "Sextuple",
      date: "2025-10-10",
      nextDoseDate: "2026-10-10",
      batch: "SX-2025-456",
      vetId: pabloId,
    },
    {
      id: nanoid(),
      petId: rockyId,
      name: "Antirrabica",
      date: "2026-02-20",
      nextDoseDate: "2027-02-20",
      batch: "AR-2026-789",
      vetId: pabloId,
    },
    // Milo
    {
      id: nanoid(),
      petId: miloId,
      name: "Triple felina",
      date: "2026-02-01",
      nextDoseDate: "2027-02-01",
      batch: "TF-2026-001",
      vetId: anaId,
    },
    {
      id: nanoid(),
      petId: miloId,
      name: "Antirrabica",
      date: "2025-11-01",
      nextDoseDate: "2026-05-01", // PROXIMA A VENCER — alerta amarilla
      batch: "AR-2025-CAT",
      vetId: anaId,
    },
  ]);
  console.log("  -> 6 vaccinations created.");

  // Treatment: desparasitacion for Luna
  await db.insert(schema.treatments).values([
    {
      id: nanoid(),
      petId: lunaId,
      type: "deworming",
      name: "Desparasitacion",
      date: "2026-03-01",
      vetId: anaId,
      notes: "Desparasitacion interna trimestral. Peso: 28kg.",
    },
  ]);
  console.log("  -> 1 treatment created.");

  // -----------------------------------------------------------------------
  // 5. Create vet schedules
  // -----------------------------------------------------------------------
  console.log("\n5. Creating vet schedules...");

  const schedules: Array<{
    vetId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }> = [];

  // Dr. Ana: Mon-Fri 8:00-18:00, Sat 9:00-13:00
  for (let d = 1; d <= 5; d++) {
    schedules.push({ vetId: anaId, dayOfWeek: d, startTime: "08:00", endTime: "18:00" });
  }
  schedules.push({ vetId: anaId, dayOfWeek: 6, startTime: "09:00", endTime: "13:00" });

  // Dr. Pablo: Mon-Fri 9:00-17:00
  for (let d = 1; d <= 5; d++) {
    schedules.push({ vetId: pabloId, dayOfWeek: d, startTime: "09:00", endTime: "17:00" });
  }

  // Dra. Laura: Mon-Sat 8:00-20:00
  for (let d = 1; d <= 6; d++) {
    schedules.push({ vetId: lauraId, dayOfWeek: d, startTime: "08:00", endTime: "20:00" });
  }

  await db
    .insert(schema.veterinarySchedules)
    .values(schedules.map((s) => ({ id: nanoid(), ...s, isActive: true })));
  console.log(`  -> ${schedules.length} schedule slots created.`);

  // -----------------------------------------------------------------------
  // 6. Create reviews
  // -----------------------------------------------------------------------
  console.log("\n6. Creating reviews...");

  await db.insert(schema.veterinaryReviews).values([
    {
      id: nanoid(),
      vetId: anaId,
      reviewerId: mariaId,
      rating: 5,
      comment: "Excelente profesional, muy atenta con Luna. La recomiendo!",
    },
    {
      id: nanoid(),
      vetId: pabloId,
      reviewerId: carlosId,
      rating: 4,
      comment: "Buen veterinario, atencion rapida y profesional.",
    },
    {
      id: nanoid(),
      vetId: anaId,
      reviewerId: carlosId,
      rating: 5,
      comment: "La mejor veterinaria de la zona.",
    },
  ]);
  console.log("  -> 3 reviews created.");

  // -----------------------------------------------------------------------
  // 7. Download example images
  // -----------------------------------------------------------------------
  console.log("\n7. Downloading example images...");

  const uploadsDir = resolve(API_ROOT, "uploads");
  const petsDir = resolve(uploadsDir, "pets");
  const avatarsDir = resolve(uploadsDir, "avatars");

  for (const dir of [petsDir, avatarsDir]) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`  -> Created ${dir}`);
    }
  }

  // Pet images
  const petImages: [string, string][] = [
    ["https://picsum.photos/id/237/400/400", resolve(petsDir, "luna.jpg")],
    ["https://picsum.photos/id/40/400/400", resolve(petsDir, "milo.jpg")],
    ["https://picsum.photos/id/169/400/400", resolve(petsDir, "rocky.jpg")],
    ["https://picsum.photos/id/1074/400/400", resolve(petsDir, "nina.jpg")],
    ["https://picsum.photos/id/210/400/400", resolve(petsDir, "kiwi.jpg")],
  ];

  // Avatar images
  const avatarImages: [string, string][] = [
    ["https://i.pravatar.cc/400?img=47", resolve(avatarsDir, "ana-vet.jpg")],
    ["https://i.pravatar.cc/400?img=12", resolve(avatarsDir, "pablo-vet.jpg")],
    ["https://i.pravatar.cc/400?img=32", resolve(avatarsDir, "laura-vet.jpg")],
    ["https://i.pravatar.cc/400?img=26", resolve(avatarsDir, "maria.jpg")],
    ["https://i.pravatar.cc/400?img=8", resolve(avatarsDir, "carlos.jpg")],
  ];

  for (const [url, dest] of [...petImages, ...avatarImages]) {
    downloadImage(url, dest);
    const filename = dest.split("/").pop();
    console.log(`  -> Downloaded ${filename}`);
  }

  // -----------------------------------------------------------------------
  // Done
  // -----------------------------------------------------------------------
  console.log("\n=== Seed complete! ===");
  console.log(`
Summary:
  - 5 users (2 owners, 3 vets)
  - 3 vet profiles with location & specialties
  - 5 pets (2 dogs, 2 cats, 1 bird)
  - 2 vet-pet links (Luna->Ana, Rocky->Pablo)
  - 6 vaccinations + 1 treatment
  - ${schedules.length} schedule slots
  - 3 reviews
  - 10 images downloaded to uploads/
  `);

  await sql.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
