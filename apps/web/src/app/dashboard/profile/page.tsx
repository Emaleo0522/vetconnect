"use client";

import { useEffect, useState } from "react";
import { useAuthStore, type UserRole } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { LogOut, Save, User, Camera } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  owner: "Dueno de mascota",
  vet: "Veterinario",
  org: "Organizacion",
  admin: "Administrador",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-primary/10 text-primary",
  vet: "bg-[#4CAF7D]/10 text-[#4CAF7D]",
  org: "bg-accent/10 text-accent-foreground",
  admin: "bg-destructive/10 text-destructive",
};

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  image: string | null;
  createdAt: string;
  // Vet fields
  license?: string;
  specialties?: string[];
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  isEmergency24h?: boolean;
  // Org fields
  orgName?: string;
  orgType?: string;
  address?: string;
  website?: string;
}

export default function ProfilePage() {
  const { user, logout, checkSession } = useAuthStore();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Editable fields — basic
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Editable fields — vet
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [specialtiesInput, setSpecialtiesInput] = useState(""); // comma-separated

  // Editable fields — org
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.get<ProfileData>("/api/users/me/profile");
        setProfile(data);
        setName(data.name);
        setPhone(data.phone ?? "");
        // Vet fields
        setClinicName(data.clinicName ?? "");
        setClinicAddress(data.clinicAddress ?? "");
        setClinicPhone(data.clinicPhone ?? "");
        setSpecialtiesInput((data.specialties ?? []).join(", "));
        // Org fields
        setOrgName(data.orgName ?? "");
        setOrgType(data.orgType ?? "");
        setOrgAddress(data.address ?? "");
        setOrgWebsite(data.website ?? "");
      } catch {
        // handled
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Solo se permiten imágenes JPG, PNG o WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5 MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const updated = await api.upload<ProfileData>(
        "/api/users/me/avatar",
        "avatar",
        file
      );
      setProfile((prev) => prev ? { ...prev, image: updated.image } : prev);
      await checkSession();
      toast.success("Foto de perfil actualizada");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Error al subir la foto");
      }
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      e.target.value = "";
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    const currentRole = profile?.role ?? user?.role ?? "owner";

    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        phone: phone.trim() || null,
      };

      if (currentRole === "vet") {
        body.clinicName = clinicName.trim() || null;
        body.clinicAddress = clinicAddress.trim() || null;
        body.clinicPhone = clinicPhone.trim() || null;
        body.specialties = specialtiesInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      if (currentRole === "org") {
        body.orgName = orgName.trim() || null;
        body.orgType = orgType.trim() || null;
        body.address = orgAddress.trim() || null;
        body.website = orgWebsite.trim() || null;
      }

      const updated = await api.put<ProfileData>("/api/users/me/profile", body);
      setProfile(updated);
      toast.success("Perfil actualizado");
      // Refresh auth store session
      await checkSession();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Error al guardar el perfil");
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Mi perfil</h1>
        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 animate-pulse">
              <div className="h-20 w-20 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 rounded bg-muted" />
                <div className="h-4 w-32 rounded bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = (profile?.name ?? user?.name ?? "??")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const role = profile?.role ?? user?.role ?? "owner";

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Mi perfil</h1>

      <div className="max-w-2xl space-y-6">
        {/* Avatar + basic info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative">
                <Avatar className="h-20 w-20" size="lg">
                  {profile?.image && (
                    <AvatarImage src={profile.image} alt={profile.name} />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-within:ring-2 focus-within:ring-ring"
                  aria-label="Cambiar foto de perfil"
                >
                  {isUploadingAvatar ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleAvatarChange}
                    disabled={isUploadingAvatar}
                  />
                </label>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-heading text-lg font-semibold">
                  {profile?.name ?? user?.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {profile?.email ?? user?.email}
                </p>
                <Badge
                  className={`mt-1.5 ${ROLE_COLORS[role] ?? "bg-muted text-muted-foreground"}`}
                >
                  {ROLE_LABELS[role] ?? role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editable fields */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Informacion personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Nombre</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-phone">Telefono</Label>
                <Input
                  id="profile-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 11 1234-5678"
                  type="tel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  value={profile?.email ?? user?.email ?? ""}
                  disabled
                  className="opacity-60"
                />
              </div>

              <div className="space-y-2">
                <Label>Rol</Label>
                <div className="flex h-8 items-center">
                  <Badge
                    className={`${ROLE_COLORS[role] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {ROLE_LABELS[role] ?? role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Vet-specific fields */}
            {role === "vet" && profile && (
              <div className="space-y-4 border-t border-border pt-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Informacion profesional
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Matricula</Label>
                    <Input
                      value={profile.license ?? ""}
                      disabled
                      className="opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vet-clinic-name">Clinica</Label>
                    <Input
                      id="vet-clinic-name"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="Nombre de la clínica"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vet-clinic-address">Direccion de la clinica</Label>
                    <Input
                      id="vet-clinic-address"
                      value={clinicAddress}
                      onChange={(e) => setClinicAddress(e.target.value)}
                      placeholder="Av. Ejemplo 1234, Ciudad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vet-clinic-phone">Telefono de la clinica</Label>
                    <Input
                      id="vet-clinic-phone"
                      value={clinicPhone}
                      onChange={(e) => setClinicPhone(e.target.value)}
                      placeholder="+54 11 1234-5678"
                      type="tel"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="vet-specialties">Especialidades</Label>
                    <Input
                      id="vet-specialties"
                      value={specialtiesInput}
                      onChange={(e) => setSpecialtiesInput(e.target.value)}
                      placeholder="Ej: Cirugía, Dermatología, Oncología (separadas por coma)"
                    />
                    {specialtiesInput.trim() && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {specialtiesInput
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((s) => (
                            <Badge
                              key={s}
                              className="bg-[#4CAF7D]/10 text-[#4CAF7D] border-[#4CAF7D]/20"
                            >
                              {s}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Guardia 24h:</span>
                    <span className="font-medium">
                      {profile.isEmergency24h ? "Si" : "No"}
                    </span>
                    <span className="text-xs text-muted-foreground">(configurable en Mis Horarios)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Org-specific fields */}
            {role === "org" && profile && (
              <div className="space-y-4 border-t border-border pt-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Informacion de la organizacion
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Nombre organizacion</Label>
                    <Input
                      id="org-name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Nombre de la organización"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-type">Tipo</Label>
                    <Input
                      id="org-type"
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value)}
                      placeholder="Ej: Refugio, Fundación, ONG"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-address">Direccion</Label>
                    <Input
                      id="org-address"
                      value={orgAddress}
                      onChange={(e) => setOrgAddress(e.target.value)}
                      placeholder="Av. Ejemplo 1234, Ciudad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-website">Sitio web</Label>
                    <Input
                      id="org-website"
                      value={orgWebsite}
                      onChange={(e) => setOrgWebsite(e.target.value)}
                      placeholder="https://www.ejemplo.org"
                      type="url"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="border-destructive/20">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">Cerrar sesion</p>
              <p className="text-xs text-muted-foreground">
                Saldras de tu cuenta en este dispositivo
              </p>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
