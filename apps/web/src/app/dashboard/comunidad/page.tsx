"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { PostCard, type Post } from "@/components/comunidad/post-card";
import { PostComposer } from "@/components/comunidad/post-composer";
import { PostSkeleton } from "@/components/comunidad/post-skeleton";
import { useAuthStore } from "@/lib/auth";
import { MessageCircle, Loader2 } from "lucide-react";

type FeedFilter = "all" | "following" | "vets" | "owners";

const FILTER_LABELS: Record<FeedFilter, string> = {
  all: "Todo",
  following: "Siguiendo",
  vets: "Veterinarios",
  owners: "Dueños",
};

interface FeedResponse {
  items: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ComunidadPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (p: number, currentFilter: FeedFilter, replace = false) => {
    if (p === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);

    try {
      const data = await api.get<FeedResponse>(
        `/api/community/posts?page=${p}&limit=10&filter=${currentFilter}`
      );
      const incoming = data.items ?? [];
      setPosts((prev) => replace ? incoming : [...prev, ...incoming]);
      setHasMore((data.pagination?.page ?? p) < (data.pagination?.totalPages ?? 1));
    } catch {
      if (p === 1) {
        // Show graceful empty state with mock data so UI is visible
        setPosts([]);
      }
      setError("No se pudo cargar el feed.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setHiddenIds(new Set());
    fetchPosts(1, filter, true);
  }, [filter, fetchPosts]);

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, filter, false);
  }

  function handlePostCreated() {
    setPage(1);
    setHiddenIds(new Set());
    fetchPosts(1, filter, true);
  }

  function handleHidePost(postId: string) {
    setHiddenIds((prev) => new Set([...prev, postId]));
  }

  const visiblePosts = posts.filter((p) => !hiddenIds.has(p.id));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Page header */}
      <div className="mb-2">
        <h1
          className="text-2xl font-medium italic leading-tight"
          style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-900)" }}
        >
          Comunidad
        </h1>
        <p
          className="mt-0.5 text-sm"
          style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
        >
          Tips, consultas e historias de la comunidad VetConnect
        </p>
      </div>

      {/* Composer */}
      <PostComposer onPostCreated={handlePostCreated} />

      {/* Filters */}
      <div
        className="flex items-center gap-1 overflow-x-auto pb-0.5"
        role="tablist"
        aria-label="Filtros de publicaciones"
      >
        {(["all", "following", "vets", "owners"] as FeedFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors"
            style={{
              fontFamily: "var(--font-inter)",
              fontWeight: filter === f ? 600 : 400,
              background: filter === f ? "var(--forest-900)" : "transparent",
              color: filter === f ? "var(--cream-50)" : "var(--warm-600)",
              border: filter === f ? "1px solid var(--forest-900)" : "1px solid var(--border)",
            }}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-3" aria-live="polite" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : visiblePosts.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 rounded-md py-16 text-center"
          style={{ border: "1px solid var(--border)", background: "var(--cream-25)" }}
          aria-live="polite"
        >
          <MessageCircle
            className="h-10 w-10"
            style={{ color: "var(--warm-200)" }}
            aria-hidden="true"
          />
          <div>
            <p
              className="font-medium italic"
              style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-700)" }}
            >
              Aún no hay publicaciones
            </p>
            <p
              className="mt-1 text-sm"
              style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
            >
              {filter === "all"
                ? "Sé el primero en compartir algo con la comunidad."
                : "Cambiá el filtro para ver más publicaciones."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3" aria-live="polite">
          {error && (
            <p
              className="rounded-md px-4 py-2 text-sm"
              style={{
                background: "var(--terracotta-100)",
                color: "var(--terracotta-700)",
                fontFamily: "var(--font-inter)",
                border: "1px solid var(--terracotta-200)",
              }}
              role="alert"
            >
              {error}
            </p>
          )}
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              onHide={handleHidePost}
            />
          ))}

          {/* Cargar más */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 rounded-md border px-5 py-2 text-sm transition-colors disabled:opacity-60"
                style={{
                  fontFamily: "var(--font-inter)",
                  borderColor: "var(--border)",
                  color: "var(--warm-700)",
                  background: "white",
                }}
              >
                {isLoadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                Cargar más
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
