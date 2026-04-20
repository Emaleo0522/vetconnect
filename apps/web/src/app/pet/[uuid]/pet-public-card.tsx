"use client";

import { QRCodeSVG } from "qrcode.react";

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

const speciesEmoji: Record<string, string> = {
  dog: "\u{1F415}",
  cat: "\u{1F431}",
  bird: "\u{1F426}",
  rabbit: "\u{1F430}",
  hamster: "\u{1F439}",
  fish: "\u{1F41F}",
  reptile: "\u{1F98E}",
  other: "\u{1F43E}",
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

const sexLabels: Record<string, string> = {
  male: "Macho",
  female: "Hembra",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PetPublicCard({ pet, uuid }: { pet: PetQrData; uuid: string }) {
  const emoji = speciesEmoji[pet.species] ?? "\u{1F43E}";
  const species = speciesLabels[pet.species] ?? pet.species;

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{ background: "var(--cream-50)" }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl"
        style={{ border: "1px solid var(--border)", background: "white", boxShadow: "var(--shadow-lg)" }}
      >
        {/* Header band — forest-900 brand */}
        <div
          className="relative px-6 py-5"
          style={{ background: "var(--forest-900)" }}
        >
          <div
            className="absolute right-4 top-4 rounded px-2.5 py-1 text-xs font-medium"
            style={{
              background: "rgba(245, 239, 224, 0.15)",
              color: "var(--cream-200)",
              fontFamily: "var(--font-inter, system-ui)",
            }}
          >
            VetConnect
          </div>
          <div className="flex items-center gap-4">
            {pet.photo ? (
              <img
                src={pet.photo}
                alt={pet.name}
                width={72}
                height={72}
                className="h-[72px] w-[72px] rounded-xl object-cover"
                style={{ border: "2px solid rgba(245, 239, 224, 0.3)" }}
              />
            ) : (
              <div
                className="flex h-[72px] w-[72px] items-center justify-center rounded-xl text-3xl"
                style={{ border: "2px solid rgba(245, 239, 224, 0.3)", background: "rgba(245, 239, 224, 0.12)" }}
              >
                {emoji}
              </div>
            )}
            <div>
              <h1
                className="text-2xl font-medium italic leading-tight"
                style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", color: "var(--cream-25, #FAF7F0)" }}
              >
                {pet.name}
              </h1>
              <p
                className="mt-0.5 text-sm"
                style={{ color: "var(--cream-200, #E0D5B8)", fontFamily: "var(--font-inter, system-ui)" }}
              >
                {species}
                {pet.breed ? ` \u00b7 ${pet.breed}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Basic info tags — editorial border-only style */}
          <div className="flex flex-wrap gap-2">
            {pet.sex && (
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  border: "1px solid var(--forest-200)",
                  color: "var(--forest-900)",
                  fontFamily: "var(--font-inter, system-ui)",
                  background: "var(--forest-50)",
                }}
              >
                {sexLabels[pet.sex] ?? pet.sex}
              </span>
            )}
            {pet.color && (
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  border: "1px solid var(--forest-200)",
                  color: "var(--forest-600)",
                  fontFamily: "var(--font-inter, system-ui)",
                  background: "var(--forest-50)",
                }}
              >
                {pet.color}
              </span>
            )}
            {pet.vaccinations.length > 0 && (
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  border: "1px solid var(--terracotta-200)",
                  color: "var(--terracotta-700)",
                  fontFamily: "var(--font-inter, system-ui)",
                  background: "var(--terracotta-100)",
                }}
              >
                {pet.vaccinations.length} vacuna{pet.vaccinations.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Vaccinations */}
          {pet.vaccinations.length > 0 && (
            <div>
              <h2
                className="mb-2.5 flex items-center gap-1.5 text-sm font-medium"
                style={{ fontFamily: "var(--font-inter, system-ui)", color: "var(--warm-800)" }}
              >
                <span className="text-base" aria-hidden="true">{"\u{1F489}"}</span>
                Vacunas registradas
              </h2>
              <div className="space-y-2">
                {pet.vaccinations.map((v, i) => {
                  const isExpired = v.nextDoseDate && new Date(v.nextDoseDate) < new Date();
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-md px-3 py-2"
                      style={{
                        border: "1px solid var(--border)",
                        background: "var(--cream-25)",
                      }}
                    >
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ fontFamily: "var(--font-inter, system-ui)", color: "var(--warm-900)" }}
                        >
                          {v.name}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter, system-ui)" }}
                        >
                          {formatDate(v.date)}
                        </p>
                      </div>
                      {v.nextDoseDate && (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            background: isExpired ? "var(--terracotta-100)" : "var(--forest-50)",
                            color: isExpired ? "var(--terracotta-700)" : "var(--forest-700)",
                            border: isExpired ? "1px solid var(--terracotta-200)" : "1px solid var(--forest-200)",
                            fontFamily: "var(--font-inter, system-ui)",
                          }}
                        >
                          {isExpired ? "Vencida" : "Al dia"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Primary vet */}
          {pet.primaryVet && (
            <div
              className="rounded-md px-4 py-3"
              style={{ border: "1px solid var(--border)", background: "var(--cream-25)" }}
            >
              <p
                className="mb-1 text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter, system-ui)" }}
              >
                Veterinario
              </p>
              <p
                className="text-sm font-semibold"
                style={{ fontFamily: "var(--font-inter, system-ui)", color: "var(--warm-900)" }}
              >
                {pet.primaryVet.name}
              </p>
              {pet.primaryVet.phone && (
                <a
                  href={`tel:${pet.primaryVet.phone}`}
                  className="text-xs transition-colors"
                  style={{ color: "var(--forest-600)" }}
                >
                  {pet.primaryVet.phone}
                </a>
              )}
            </div>
          )}

          {/* QR code */}
          <div
            className="flex flex-col items-center gap-3 rounded-xl p-4"
            style={{ border: "1px solid var(--border)", background: "white" }}
          >
            <QRCodeSVG
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/pet/${uuid}`}
              size={140}
              level="H"
              fgColor="var(--forest-900, #1F3C2E)"
              className="rounded"
              aria-label="Código QR del perfil de la mascota"
            />
            <p
              className="text-center text-xs"
              style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter, system-ui)" }}
            >
              Escanea para ver este perfil
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3"
          style={{ borderTop: "1px solid var(--border)", background: "var(--cream-25)" }}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-xs"
              style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter, system-ui)" }}
            >
              Perfil verificado por{" "}
              <a
                href="/"
                className="font-medium transition-colors"
                style={{ color: "var(--forest-600)" }}
              >
                VetConnect Global
              </a>
            </p>
            <span className="text-lg" aria-hidden="true">{"\u{1F43E}"}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
