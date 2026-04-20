"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Share2, MoreHorizontal, Flag, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    role: "owner" | "vet";
    avatarUrl?: string;
  };
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  liked: boolean;
  hidden?: boolean;
  reported?: boolean;
  createdAt: string;
}

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onHide?: (postId: string) => void;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) {
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  }
  if (diffDays > 0) return `hace ${diffDays}d`;
  if (diffHours > 0) return `hace ${diffHours}h`;
  if (diffMins > 0) return `hace ${diffMins}m`;
  return "ahora";
}

export function PostCard({ post, currentUserId, onHide }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reported, setReported] = useState(post.reported ?? false);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);

  const initials = post.author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function toggleLike() {
    const prev = liked;
    const prevCount = likesCount;
    setLiked(!prev);
    setLikesCount(prev ? prevCount - 1 : prevCount + 1);
    try {
      if (prev) {
        await api.delete(`/api/community/posts/${post.id}/like`);
      } else {
        await api.post(`/api/community/posts/${post.id}/like`);
      }
    } catch {
      setLiked(prev);
      setLikesCount(prevCount);
    }
  }

  async function handleReport(reason: "spam" | "inappropriate" | "other") {
    setReportMenuOpen(false);
    setMenuOpen(false);
    try {
      await api.post(`/api/community/posts/${post.id}/report`, { reason });
      setReported(true);
      onHide?.(post.id);
    } catch {
      // silent — optimistic was already applied client-side
    }
  }

  function handleHide() {
    setMenuOpen(false);
    onHide?.(post.id);
    // Also mark server-side
    api.post(`/api/community/posts/${post.id}/hide`).catch(() => {});
  }

  return (
    <article
      className="rounded-md bg-white"
      style={{ border: "1px solid var(--border)", fontFamily: "var(--font-source-serif)" }}
      aria-label={`Publicación de ${post.author.name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            {post.author.avatarUrl ? (
              <Image
                src={post.author.avatarUrl}
                alt={post.author.name}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
            ) : null}
            <AvatarFallback
              style={{
                background: "var(--forest-900)",
                color: "var(--cream-50)",
                fontFamily: "var(--font-inter)",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-sm font-medium leading-tight"
                style={{ fontFamily: "var(--font-inter)", color: "var(--warm-900)" }}
              >
                {post.author.name}
              </span>
              {/* Role badge — editorial (text only, NOT pill) */}
              <span
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{
                  fontFamily: "var(--font-inter)",
                  color: post.author.role === "vet" ? "var(--forest-600)" : "var(--warm-400)",
                  letterSpacing: "0.08em",
                }}
              >
                {post.author.role === "vet" ? "Veterinario/a" : "Dueño/a"}
              </span>
            </div>
            <time
              className="text-xs"
              dateTime={post.createdAt}
              style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter)" }}
            >
              {timeAgo(post.createdAt)}
            </time>
          </div>
        </div>

        {/* Menu ⋯ */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded transition-colors"
            style={{ color: "var(--warm-400)" }}
            aria-label="Opciones de publicación"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => { setMenuOpen(false); setReportMenuOpen(false); }}
                aria-hidden="true"
              />
              <div
                className="absolute right-0 top-9 z-20 min-w-[168px] rounded-md bg-white py-1"
                style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
                role="menu"
              >
                {reported ? (
                  <p
                    className="px-3 py-2 text-xs italic"
                    style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter)" }}
                  >
                    Ya reportado
                  </p>
                ) : (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-cream-50"
                      style={{ fontFamily: "var(--font-inter)", color: "var(--warm-700)" }}
                      onClick={() => { setReportMenuOpen(true); setMenuOpen(false); }}
                    >
                      <Flag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      Reportar publicación
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-cream-50"
                      style={{ fontFamily: "var(--font-inter)", color: "var(--warm-700)" }}
                      onClick={handleHide}
                    >
                      <EyeOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      Ocultar publicación
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Sub-menu razón de reporte */}
          {reportMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setReportMenuOpen(false)}
                aria-hidden="true"
              />
              <div
                className="absolute right-0 top-9 z-20 min-w-[200px] rounded-md bg-white py-1"
                style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
                role="menu"
                aria-label="Motivo del reporte"
              >
                <p
                  className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-wider"
                  style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter)" }}
                >
                  Motivo del reporte
                </p>
                {(["spam", "inappropriate", "other"] as const).map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-cream-50"
                    style={{ fontFamily: "var(--font-inter)", color: "var(--warm-700)" }}
                    onClick={() => handleReport(reason)}
                  >
                    {reason === "spam" ? "Spam" : reason === "inappropriate" ? "Contenido inapropiado" : "Otro motivo"}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--warm-900)", fontFamily: "var(--font-source-serif)" }}
        >
          {post.content}
        </p>
      </div>

      {/* Image (optional) */}
      {post.imageUrl && (
        <div className="relative mx-4 mb-3 overflow-hidden rounded-md" style={{ aspectRatio: "16/9" }}>
          <Image
            src={post.imageUrl}
            alt="Imagen adjunta a la publicación"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
          />
        </div>
      )}

      {/* Footer actions */}
      <div
        className="flex items-center gap-1 px-3 pb-3 pt-1"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {/* Like */}
        <button
          type="button"
          onClick={toggleLike}
          className={cn(
            "flex items-center gap-1.5 rounded px-2 py-1.5 text-xs transition-colors",
            liked ? "text-terracotta-600" : "text-warm-400 hover:text-warm-700"
          )}
          style={{ fontFamily: "var(--font-inter)" }}
          aria-label={liked ? `Quitar me gusta (${likesCount})` : `Me gusta (${likesCount})`}
          aria-pressed={liked}
        >
          <Heart
            className="h-4 w-4 shrink-0 transition-colors"
            style={{
              fill: liked ? "var(--terracotta-500)" : "transparent",
              stroke: liked ? "var(--terracotta-500)" : "currentColor",
            }}
            aria-hidden="true"
          />
          <span>{likesCount}</span>
        </button>

        {/* Comment */}
        <Link
          href={`/dashboard/comunidad/${post.id}`}
          className="flex items-center gap-1.5 rounded px-2 py-1.5 text-xs transition-colors"
          style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter)" }}
          aria-label={`Ver comentarios (${post.commentsCount})`}
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{post.commentsCount}</span>
        </Link>

        {/* Share */}
        <button
          type="button"
          className="ml-auto flex items-center gap-1.5 rounded px-2 py-1.5 text-xs transition-colors"
          style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter)" }}
          aria-label="Compartir publicación"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `Publicación de ${post.author.name} en VetConnect`,
                url: `${window.location.origin}/dashboard/comunidad/${post.id}`,
              }).catch(() => {});
            }
          }}
        >
          <Share2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
