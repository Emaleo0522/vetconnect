"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore, type UserRole } from "@/lib/auth";
import { Loader2, PawPrint, Stethoscope, Building2, ChevronLeft } from "lucide-react";

type RoleOption = "owner" | "vet" | "org";

const ROLE_OPTIONS: {
  value: RoleOption;
  label: string;
  desc: string;
  Icon: React.ElementType;
}[] = [
  {
    value: "owner",
    label: "Dueno de mascota",
    desc: "Registra y cuida a tus mascotas",
    Icon: PawPrint,
  },
  {
    value: "vet",
    label: "Veterinario",
    desc: "Ofrece tus servicios profesionales",
    Icon: Stethoscope,
  },
  {
    value: "org",
    label: "Organizacion",
    desc: "Refugio, rescate o fundacion",
    Icon: Building2,
  },
];

// Password policy helper
function PasswordHint({ value }: { value: string }) {
  const has8 = value.length >= 8;
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);

  if (!value) return null;

  return (
    <div
      className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs"
      style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
    >
      <span style={{ color: has8 ? "var(--forest-600)" : "var(--terracotta-700)" }}>
        {has8 ? "✓" : "✗"} 8+ caracteres
      </span>
      <span style={{ color: hasUpper ? "var(--forest-600)" : "var(--terracotta-700)" }}>
        {hasUpper ? "✓" : "✗"} 1 mayuscula
      </span>
      <span style={{ color: hasNumber ? "var(--forest-600)" : "var(--terracotta-700)" }}>
        {hasNumber ? "✓" : "✗"} 1 numero
      </span>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { registerOwner, registerVet, registerOrg } = useAuthStore();
  const [role, setRole] = useState<RoleOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos comunes
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Campos vet
  const [license, setLicense] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");

  // Campos org
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<"shelter" | "rescue" | "foundation" | "other">("shelter");
  const [orgAddress, setOrgAddress] = useState("");
  const [website, setWebsite] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;

    // Validación básica password policy
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      if (role === "owner") {
        await registerOwner({ name, email, password, phone: phone || undefined });
      } else if (role === "vet") {
        await registerVet({
          name,
          email,
          password,
          phone: phone || undefined,
          license,
          specialties: specialties.split(",").map((s) => s.trim()).filter(Boolean),
          clinicName,
          clinicAddress,
          clinicPhone,
          latitude: -34.6037,
          longitude: -58.3816,
        });
      } else if (role === "org") {
        await registerOrg({
          name,
          email,
          password,
          phone: phone || undefined,
          orgName,
          orgType,
          address: orgAddress,
          website: website || undefined,
        });
      }
      router.push("/dashboard/pets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear cuenta. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // --- Step 1: Selección de rol ---
  if (!role) {
    return (
      <main
        id="main-content"
        className="flex min-h-screen flex-col items-center justify-center px-6 py-12"
        style={{ background: "var(--cream-50)" }}
      >
        <div className="mb-10">
          <Image
            src="/logo/logo-horizontal-light.svg"
            alt="VetConnect Global"
            width={140}
            height={35}
            priority
          />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1
              className="text-3xl"
              style={{
                fontFamily: "var(--font-fraunces)",
                fontStyle: "italic",
                color: "var(--warm-900)",
                fontWeight: 400,
              }}
            >
              Crear cuenta
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
            >
              Que tipo de cuenta queres abrir?
            </p>
          </div>

          <div className="space-y-3">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className="flex w-full items-center gap-4 rounded px-4 py-3.5 text-left transition-colors"
                style={{
                  border: "1px solid var(--border-strong)",
                  background: "var(--surface)",
                  fontFamily: "var(--font-inter)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--forest-700)";
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--forest-50)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)";
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)";
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded"
                  style={{ background: "var(--forest-50)", color: "var(--forest-900)" }}
                >
                  <opt.Icon className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--warm-900)" }}
                  >
                    {opt.label}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--warm-600)" }}
                  >
                    {opt.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <p
            className="mt-8 text-center text-sm"
            style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
          >
            Ya tenes cuenta?{" "}
            <Link
              href="/login"
              className="font-medium transition-colors hover:underline"
              style={{ color: "var(--forest-700)" }}
            >
              Inicia sesion
            </Link>
          </p>
        </div>
      </main>
    );
  }

  // --- Step 2: Formulario de registro ---
  const currentRole = ROLE_OPTIONS.find((r) => r.value === role)!;

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center px-6 py-12"
      style={{ background: "var(--cream-50)" }}
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setRole(null)}
            className="mb-4 flex items-center gap-1 text-sm transition-colors hover:underline"
            style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Volver
          </button>
          <h1
            className="text-3xl"
            style={{
              fontFamily: "var(--font-fraunces)",
              fontStyle: "italic",
              color: "var(--warm-900)",
              fontWeight: 400,
            }}
          >
            Registro como{" "}
            <span style={{ color: "var(--forest-700)" }}>{currentRole.label.toLowerCase()}</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Org — datos de la organización primero */}
          {role === "org" && (
            <div
              className="space-y-4 rounded p-4"
              style={{
                border: "1px solid var(--forest-200)",
                background: "var(--forest-50)",
              }}
            >
              <p
                className="text-xs font-medium uppercase tracking-widest"
                style={{ fontFamily: "var(--font-inter)", color: "var(--forest-700)" }}
              >
                Datos de la organizacion
              </p>
              <FormField label="Nombre de la organizacion" required>
                <input
                  type="text"
                  className="input-editorial"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Refugio Patitas Felices"
                  required
                />
              </FormField>
              <FormField label="Tipo de organizacion" required>
                <select
                  className="input-editorial"
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value as typeof orgType)}
                  required
                >
                  <option value="shelter">Refugio</option>
                  <option value="rescue">Rescate</option>
                  <option value="foundation">Fundacion</option>
                  <option value="other">Otro</option>
                </select>
              </FormField>
              <FormField label="Direccion" required>
                <input
                  type="text"
                  className="input-editorial"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  placeholder="Av. San Martin 5678, CABA"
                  required
                />
              </FormField>
              <FormField label="Sitio web">
                <input
                  type="url"
                  className="input-editorial"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://mirefugio.org"
                />
              </FormField>
            </div>
          )}

          {/* Campos comunes */}
          <FormField
            label={role === "org" ? "Nombre del responsable" : "Nombre completo"}
            required
          >
            <input
              type="text"
              className="input-editorial"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Perez"
              autoComplete="name"
              required
            />
          </FormField>

          <FormField label={role === "org" ? "Email de contacto" : "Email"} required>
            <input
              type="email"
              className="input-editorial"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
          </FormField>

          <FormField label="Contraseña" required>
            <input
              type="password"
              className="input-editorial"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 caracteres"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <PasswordHint value={password} />
          </FormField>

          <FormField label={role === "org" ? "Telefono de la organizacion" : "Telefono (opcional)"} required={role === "org"}>
            <input
              type="tel"
              className="input-editorial"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 11 1234-5678"
              autoComplete="tel"
              required={role === "org"}
            />
          </FormField>

          {/* Campos vet */}
          {role === "vet" && (
            <div
              className="space-y-4 rounded p-4"
              style={{
                border: "1px solid var(--forest-200)",
                background: "var(--forest-50)",
              }}
            >
              <p
                className="text-xs font-medium uppercase tracking-widest"
                style={{ fontFamily: "var(--font-inter)", color: "var(--forest-700)" }}
              >
                Datos profesionales
              </p>
              <FormField label="Matricula" required>
                <input
                  type="text"
                  className="input-editorial"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  placeholder="MP1234"
                  required
                />
              </FormField>
              <FormField label="Especialidades (separadas por coma)" required>
                <input
                  type="text"
                  className="input-editorial"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  placeholder="Clinica general, Cirugia"
                  required
                />
              </FormField>
              <FormField label="Nombre de la clinica" required>
                <input
                  type="text"
                  className="input-editorial"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Veterinaria San Roque"
                  required
                />
              </FormField>
              <FormField label="Direccion de la clinica" required>
                <input
                  type="text"
                  className="input-editorial"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  placeholder="Av. Corrientes 1234, CABA"
                  required
                />
              </FormField>
              <FormField label="Telefono de la clinica" required>
                <input
                  type="tel"
                  className="input-editorial"
                  value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value)}
                  placeholder="+54 11 5555-0000"
                  required
                />
              </FormField>
            </div>
          )}

          {/* Error inline */}
          {error && (
            <div
              role="alert"
              className="rounded px-3 py-2 text-sm"
              style={{
                background: "var(--terracotta-100)",
                color: "var(--terracotta-700)",
                fontFamily: "var(--font-inter)",
                border: "1px solid var(--terracotta-200)",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded px-4 py-3 text-sm font-medium transition-colors disabled:opacity-60"
            style={{
              background: loading ? "var(--forest-700)" : "var(--forest-900)",
              color: "var(--cream-25)",
              fontFamily: "var(--font-inter)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p
          className="mt-8 text-center text-sm"
          style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
        >
          Ya tenes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium transition-colors hover:underline"
            style={{ color: "var(--forest-700)" }}
          >
            Inicia sesion
          </Link>
        </p>
      </div>
    </main>
  );
}

// Helper: campo de formulario editorial
function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label
        className="label-editorial"
        style={{ display: "block" }}
      >
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: "var(--terracotta-700)", marginLeft: "2px" }}>
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
