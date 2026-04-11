"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore, type UserRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PawPrint, Stethoscope, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type RoleOption = "owner" | "vet" | "org";

const ROLE_OPTIONS: { value: RoleOption; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    value: "owner",
    label: "Dueno de mascota",
    icon: <PawPrint className="h-5 w-5" />,
    desc: "Registra y cuida a tus mascotas",
  },
  {
    value: "vet",
    label: "Veterinario",
    icon: <Stethoscope className="h-5 w-5" />,
    desc: "Ofrece tus servicios profesionales",
  },
  {
    value: "org",
    label: "Organizacion",
    icon: <Building2 className="h-5 w-5" />,
    desc: "Refugio, rescate o fundacion",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { registerOwner, registerVet, registerOrg } = useAuthStore();
  const [role, setRole] = useState<RoleOption | null>(null);
  const [loading, setLoading] = useState(false);

  // Common fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Vet fields
  const [license, setLicense] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");

  // Org fields
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<"shelter" | "rescue" | "foundation" | "other">("shelter");
  const [orgAddress, setOrgAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [orgDescription, setOrgDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) {
      toast.error("Selecciona un tipo de cuenta");
      return;
    }

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
          latitude: -34.6037, // Default Buenos Aires
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
      toast.success("Cuenta creada exitosamente");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  }

  // Step 1: Role selection
  if (!role) {
    return (
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center px-4 py-12"
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <PawPrint className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-heading text-2xl">Crear cuenta</CardTitle>
            <CardDescription>
              Que tipo de cuenta queres crear?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className="flex w-full items-center gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {opt.icon}
                </div>
                <div>
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-sm text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            ))}
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Ya tenes cuenta?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Inicia sesion
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    );
  }

  // Step 2: Registration form
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center px-4 py-12"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRole(null)}
              type="button"
            >
              &larr; Atras
            </Button>
          </div>
          <CardTitle className="font-heading text-2xl">
            Registro como {ROLE_OPTIONS.find((r) => r.value === role)?.label}
          </CardTitle>
          <CardDescription>Completa tus datos para crear la cuenta</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Org-specific fields FIRST when role is org */}
            {role === "org" && (
              <>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
                  <p className="text-sm font-semibold text-primary flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Datos de la organizacion
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Nombre de la organizacion *</Label>
                    <Input
                      id="org-name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Refugio Patitas Felices"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-type">Tipo *</Label>
                    <Select
                      value={orgType}
                      onValueChange={(v) => setOrgType(v as typeof orgType)}
                    >
                      <SelectTrigger id="org-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shelter">Refugio</SelectItem>
                        <SelectItem value="rescue">Rescate</SelectItem>
                        <SelectItem value="foundation">Fundacion</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-description">Descripcion / Mision</Label>
                    <Textarea
                      id="org-description"
                      value={orgDescription}
                      onChange={(e) => setOrgDescription(e.target.value)}
                      placeholder="Contanos sobre la organizacion, su mision y que tipo de animales atienden..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-address">Direccion *</Label>
                    <Input
                      id="org-address"
                      value={orgAddress}
                      onChange={(e) => setOrgAddress(e.target.value)}
                      placeholder="Av. San Martin 5678, CABA"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio web</Label>
                    <Input
                      id="website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://www.mirefugio.org"
                    />
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    Persona de contacto
                  </p>
                </div>
              </>
            )}

            {/* Common fields — labels change based on role */}
            <div className="space-y-2">
              <Label htmlFor="name">
                {role === "org" ? "Nombre del responsable" : "Nombre completo"}
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === "org" ? "Nombre y apellido del responsable" : "Juan Perez"}
                autoComplete="name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">
                {role === "org" ? "Email de contacto" : "Email"}
              </Label>
              <Input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === "org" ? "contacto@mirefugio.org" : "tu@email.com"}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Contrasena</Label>
              <Input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 caracteres, 1 mayuscula, 1 numero"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                {role === "org" ? "Telefono de la organizacion" : "Telefono (opcional)"}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678"
                autoComplete="tel"
                required={role === "org"}
              />
            </div>

            {/* Vet-specific fields */}
            {role === "vet" && (
              <>
                <div className="border-t border-border pt-4">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">
                    Datos profesionales
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">Matricula</Label>
                  <Input
                    id="license"
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    placeholder="MP1234"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialties">Especialidades (separadas por coma)</Label>
                  <Input
                    id="specialties"
                    value={specialties}
                    onChange={(e) => setSpecialties(e.target.value)}
                    placeholder="Clinica general, Cirugia, Dermatologia"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-name">Nombre de la clinica</Label>
                  <Input
                    id="clinic-name"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="Veterinaria San Roque"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-address">Direccion de la clinica</Label>
                  <Input
                    id="clinic-address"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    placeholder="Av. Corrientes 1234, CABA"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-phone">Telefono de la clinica</Label>
                  <Input
                    id="clinic-phone"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    placeholder="+54 11 5555-0000"
                    required
                  />
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear cuenta
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Ya tenes cuenta?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Inicia sesion
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
