"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarDays, Clock, Save, Shield } from "lucide-react";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface ScheduleSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const DEFAULT_SCHEDULE: ScheduleSlot[] = DAY_NAMES.map((_, i) => ({
  dayOfWeek: i,
  startTime: "09:00",
  endTime: "18:00",
  isActive: i >= 1 && i <= 5, // Mon–Fri active by default
}));

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SchedulePage() {
  const user = useAuthStore((s) => s.user);

  const [schedule, setSchedule] = useState<ScheduleSlot[]>(DEFAULT_SCHEDULE);
  const [isEmergency, setIsEmergency] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingEmergency, setTogglingEmergency] = useState(false);

  useEffect(() => {
    async function fetchSchedule() {
      if (!user?.id) return;
      try {
        const [sched, profile] = await Promise.allSettled([
          api.get<ScheduleSlot[]>(`/api/vets/${user.id}/schedule`),
          api.get<{ isEmergency24h: boolean }>("/api/users/me/profile"),
        ]);

        if (sched.status === "fulfilled" && sched.value.length > 0) {
          // Merge fetched schedule into the 7-day grid
          const merged = DEFAULT_SCHEDULE.map((def) => {
            const fetched = sched.value.find((s) => s.dayOfWeek === def.dayOfWeek);
            return fetched ?? def;
          });
          setSchedule(merged);
        }

        if (profile.status === "fulfilled") {
          setIsEmergency(profile.value.isEmergency24h ?? false);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, [user?.id]);

  function updateSlot(dayOfWeek: number, field: keyof ScheduleSlot, value: unknown) {
    setSchedule((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s))
    );
  }

  async function handleSave() {
    const activeSlots = schedule.filter((s) => s.isActive);
    if (activeSlots.length === 0) {
      toast.error("Activá al menos un día de atención");
      return;
    }

    // Basic time validation
    for (const slot of activeSlots) {
      if (slot.startTime >= slot.endTime) {
        toast.error(`${DAY_NAMES[slot.dayOfWeek]}: la hora de fin debe ser mayor a la de inicio`);
        return;
      }
    }

    setSaving(true);
    try {
      await api.put("/api/vets/me/schedule", schedule);
      toast.success("Horarios guardados correctamente");
    } catch {
      toast.error("Error al guardar los horarios");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleEmergency(checked: boolean) {
    setTogglingEmergency(true);
    const previous = isEmergency;
    setIsEmergency(checked); // optimistic
    try {
      await api.put("/api/vets/me/emergency", { isEmergency: checked });
      toast.success(
        checked ? "Guardia 24h activada" : "Guardia 24h desactivada"
      );
    } catch {
      setIsEmergency(previous); // rollback
      toast.error("Error al cambiar el estado de guardia");
    } finally {
      setTogglingEmergency(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Mis horarios</h1>
        <div className="space-y-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const activeCount = schedule.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">Mis horarios</h1>
        <p className="text-sm text-muted-foreground">
          Configurá los días y horarios en que atendés pacientes.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Emergency 24h toggle */}
        <Card className={isEmergency ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20" : ""}>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isEmergency ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-muted"}`}>
                <Shield className={`h-5 w-5 ${isEmergency ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-medium">Guardia 24h</p>
                <p className="text-sm text-muted-foreground">
                  {isEmergency
                    ? "Aparecés como disponible para emergencias"
                    : "Activá para recibir consultas de urgencia"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEmergency && (
                <Badge className="border-emerald-500 text-emerald-600 dark:text-emerald-400" variant="outline">
                  Activa
                </Badge>
              )}
              <Switch
                checked={isEmergency}
                onCheckedChange={handleToggleEmergency}
                disabled={togglingEmergency}
                aria-label="Toggle guardia 24h"
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule grid */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2 font-heading">
              <CalendarDays className="h-5 w-5 text-primary" />
              Días de atención
            </CardTitle>
            <Badge variant="secondary">
              {activeCount} día{activeCount !== 1 ? "s" : ""} activo{activeCount !== 1 ? "s" : ""}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {schedule.map((slot) => (
              <div
                key={slot.dayOfWeek}
                className={`rounded-lg border p-3 transition-colors ${
                  slot.isActive
                    ? "border-primary/20 bg-primary/5"
                    : "bg-muted/30 opacity-60"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {/* Day toggle */}
                  <div className="flex items-center gap-3 sm:w-36">
                    <Switch
                      checked={slot.isActive}
                      onCheckedChange={(checked) =>
                        updateSlot(slot.dayOfWeek, "isActive", checked)
                      }
                      id={`day-${slot.dayOfWeek}`}
                    />
                    <Label
                      htmlFor={`day-${slot.dayOfWeek}`}
                      className="cursor-pointer font-medium"
                    >
                      {DAY_NAMES[slot.dayOfWeek]}
                    </Label>
                  </div>

                  {/* Time range */}
                  {slot.isActive && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          updateSlot(slot.dayOfWeek, "startTime", e.target.value)
                        }
                        className="w-32"
                        aria-label={`Hora inicio ${DAY_NAMES[slot.dayOfWeek]}`}
                      />
                      <span className="text-sm text-muted-foreground">a</span>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          updateSlot(slot.dayOfWeek, "endTime", e.target.value)
                        }
                        className="w-32"
                        aria-label={`Hora fin ${DAY_NAMES[slot.dayOfWeek]}`}
                      />
                    </div>
                  )}

                  {!slot.isActive && (
                    <span className="text-sm text-muted-foreground">
                      No disponible
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-32">
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar horarios"}
          </Button>
        </div>
      </div>
    </div>
  );
}
