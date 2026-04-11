"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
}

export function StatsCard({ title, value, icon, highlight }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p
            className={cn(
              "text-2xl font-bold",
              highlight && "text-amber-500 dark:text-amber-400",
            )}
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
