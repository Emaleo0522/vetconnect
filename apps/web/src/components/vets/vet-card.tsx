"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "./star-rating";
import { Clock, MapPin } from "lucide-react";

export interface VetListItem {
  id: string;
  name: string;
  image: string | null;
  specialties: string[];
  clinicName: string;
  clinicAddress: string;
  isEmergency24h: boolean;
  avgRating: number | null;
  reviewCount: number;
  latitude?: string;
  longitude?: string;
}

interface VetCardProps {
  vet: VetListItem;
}

export function VetCard({ vet }: VetCardProps) {
  const initials = vet.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-16 w-16 shrink-0" size="lg">
            {vet.image && (
              <AvatarImage src={vet.image} alt={vet.name} />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-heading text-base font-semibold leading-tight truncate">
                {vet.name}
              </h3>
              {vet.isEmergency24h && (
                <Badge className="shrink-0 bg-destructive/10 text-destructive border-destructive/20 text-xs">
                  <Clock className="mr-1 h-3 w-3" />
                  24h
                </Badge>
              )}
            </div>

            <p className="flex items-center gap-1 text-sm text-muted-foreground truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {vet.clinicName}
            </p>

            <div className="flex flex-wrap gap-1">
              {vet.specialties.map((spec) => (
                <Badge
                  key={spec}
                  className="bg-[#4CAF7D]/10 text-[#4CAF7D] border-[#4CAF7D]/20 text-xs font-normal"
                >
                  {spec}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                {vet.avgRating ? (
                  <>
                    <StarRating value={vet.avgRating} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      ({vet.reviewCount})
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Sin resenas
                  </span>
                )}
              </div>

              <Link
                href={`/dashboard/vets/${vet.id}`}
                className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                Ver perfil
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
