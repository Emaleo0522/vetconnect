"use client";

import { cn } from "@/lib/utils";

interface ScheduleEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface ScheduleTableProps {
  schedule: ScheduleEntry[];
  isEmergency24h: boolean;
}

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

function formatTime(time: string): string {
  // "08:00:00" -> "08:00"
  return time.slice(0, 5);
}

export function ScheduleTable({ schedule, isEmergency24h }: ScheduleTableProps) {
  // Build a map for all 7 days (0=Sun..6=Sat), display order Mon-Sun
  const dayMap = new Map<number, ScheduleEntry>();
  for (const entry of schedule) {
    dayMap.set(entry.dayOfWeek, entry);
  }

  // Display order: 1(Mon),2(Tue),3(Wed),4(Thu),5(Fri),6(Sat),0(Sun)
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="space-y-3">
      {isEmergency24h && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-destructive" />
          Guardia 24 horas disponible
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm" role="table" aria-label="Horarios de atencion">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Dia</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Horario</th>
              <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Estado</th>
            </tr>
          </thead>
          <tbody>
            {displayOrder.map((dayNum) => {
              const entry = dayMap.get(dayNum);
              const isActive = entry?.isActive ?? false;

              return (
                <tr
                  key={dayNum}
                  className={cn(
                    "border-b border-border last:border-0",
                    !isActive && "opacity-60",
                  )}
                >
                  <td className="px-4 py-2.5 font-medium">{DAY_NAMES[dayNum]}</td>
                  <td className="px-4 py-2.5">
                    {isActive && entry
                      ? `${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={
                        isActive
                          ? {
                              background: "var(--forest-50)",
                              color: "var(--forest-700)",
                              border: "1px solid var(--forest-200)",
                            }
                          : {
                              background: "var(--cream-100)",
                              color: "var(--warm-400)",
                            }
                      }
                    >
                      {isActive ? "Abierto" : "Cerrado"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
