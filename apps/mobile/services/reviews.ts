import { api } from "@/lib/api";
import type { CreateReviewInput } from "@vetconnect/shared/validators/reviews";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReviewItem {
  id: string;
  vetId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface PaginatedReviews {
  data: ReviewItem[];
  nextCursor: string | null;
  total: number;
}

export interface ReviewCheckResponse {
  hasReviewed: boolean;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function fetchReviews(
  vetId: string,
  cursor?: string,
  limit = 10,
): Promise<PaginatedReviews> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));

  const qs = params.toString();
  const res = await api.get<any>(`/api/vets/${vetId}/reviews${qs ? `?${qs}` : ""}`);
  // Normalize API response
  return {
    data: res.data || [],
    nextCursor: res.pagination?.nextCursor ?? res.nextCursor ?? null,
    total: res.meta?.totalCount ?? res.total ?? (res.data?.length || 0),
  };
}

export async function createReview(
  vetId: string,
  data: CreateReviewInput,
): Promise<ReviewItem> {
  return api.post<ReviewItem>(`/api/vets/${vetId}/reviews`, data);
}
