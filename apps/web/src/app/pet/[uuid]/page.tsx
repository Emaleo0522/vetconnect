import type { Metadata } from "next";
import { PetPublicCard } from "./pet-public-card";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface PetQrData {
  name: string;
  species: string;
  breed: string | null;
  sex: string;
  color: string | null;
  photo: string | null;
  vaccinations: { name: string; date: string; nextDoseDate: string | null }[];
  primaryVet: { name: string; phone: string | null } | null;
}

async function fetchPetData(uuid: string): Promise<PetQrData | null> {
  try {
    const res = await fetch(`${API_URL}/api/pets/qr/${uuid}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

const speciesEmoji: Record<string, string> = {
  dog: "🐕",
  cat: "🐱",
  bird: "🐦",
  rabbit: "🐰",
  hamster: "🐹",
  fish: "🐟",
  reptile: "🦎",
  other: "🐾",
};

const speciesLabels: Record<string, string> = {
  dog: "Perro",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Conejo",
  hamster: "Hamster",
  fish: "Pez",
  reptile: "Reptil",
  other: "Otro",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uuid: string }>;
}): Promise<Metadata> {
  const { uuid } = await params;
  const pet = await fetchPetData(uuid);

  if (!pet) {
    return {
      title: "Mascota no encontrada",
      description: "Este perfil de mascota no existe o fue eliminado.",
    };
  }

  const emoji = speciesEmoji[pet.species] ?? "🐾";
  const species = speciesLabels[pet.species] ?? pet.species;
  const title = `${emoji} ${pet.name} — VetConnect`;
  const description = `${pet.name} es un ${species.toLowerCase()}${pet.breed ? ` ${pet.breed}` : ""}. Perfil de salud verificado en VetConnect Global.${pet.vaccinations.length > 0 ? ` ${pet.vaccinations.length} vacunas registradas.` : ""}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `${APP_URL}/pet/${uuid}`,
      siteName: "VetConnect Global",
      images: pet.photo
        ? [{ url: pet.photo, width: 400, height: 400, alt: pet.name }]
        : [{ url: `${APP_URL}/images/hero.jpg`, width: 1200, height: 630, alt: "VetConnect Global" }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: pet.photo ? [pet.photo] : [`${APP_URL}/images/hero.jpg`],
    },
  };
}

export default async function PetPublicPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const pet = await fetchPetData(uuid);

  if (!pet) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <span className="text-3xl">🐾</span>
          </div>
          <h1 className="mb-2 font-heading text-xl font-bold">Mascota no encontrada</h1>
          <p className="text-sm text-muted-foreground">
            Este perfil no existe o fue eliminado.
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir a VetConnect
          </a>
        </div>
      </main>
    );
  }

  return <PetPublicCard pet={pet} uuid={uuid} />;
}
