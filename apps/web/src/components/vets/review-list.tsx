"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "./star-rating";

export interface Review {
  id: string;
  vetId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerImage: string | null;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewListProps {
  reviews: Review[];
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  if (diffDays > 0) return `hace ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
  if (diffHours > 0) return `hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  if (diffMins > 0) return `hace ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
  return "justo ahora";
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Aun no hay resenas. Se el primero en opinar.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {reviews.map((review) => {
        const initials = review.reviewerName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div key={review.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
            <Avatar className="h-10 w-10 shrink-0">
              {review.reviewerImage && (
                <AvatarImage src={review.reviewerImage} alt={review.reviewerName} />
              )}
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{review.reviewerName}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(review.createdAt)}
                </span>
              </div>

              <StarRating value={review.rating} size="sm" />

              <p className="text-sm text-foreground/80">{review.comment}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
