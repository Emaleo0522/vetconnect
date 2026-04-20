"use client";

import { useState } from "react";
import Image from "next/image";
import { CornerDownRight, Heart } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    role: "owner" | "vet";
    avatarUrl?: string;
  };
  content: string;
  likesCount: number;
  liked: boolean;
  createdAt: string;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  depth?: number;
  onReply?: (commentId: string, authorName: string) => void;
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

export function CommentItem({ comment, postId, depth = 0, onReply }: CommentItemProps) {
  const [liked, setLiked] = useState(comment.liked);
  const [likesCount, setLikesCount] = useState(comment.likesCount);

  const initials = comment.author.name
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
        await api.delete(`/api/community/posts/${postId}/comments/${comment.id}/like`);
      } else {
        await api.post(`/api/community/posts/${postId}/comments/${comment.id}/like`);
      }
    } catch {
      setLiked(prev);
      setLikesCount(prevCount);
    }
  }

  return (
    <div className={cn("flex gap-3", depth > 0 && "pl-8")}>
      {/* Connector line for replies */}
      {depth > 0 && (
        <CornerDownRight
          className="mt-1 h-3.5 w-3.5 shrink-0"
          style={{ color: "var(--warm-200)" }}
          aria-hidden="true"
        />
      )}

      <Avatar className="h-7 w-7 shrink-0">
        {comment.author.avatarUrl ? (
          <Image
            src={comment.author.avatarUrl}
            alt={comment.author.name}
            width={28}
            height={28}
            className="rounded-full object-cover"
          />
        ) : null}
        <AvatarFallback
          style={{
            background: depth === 0 ? "var(--forest-900)" : "var(--forest-600)",
            color: "var(--cream-50)",
            fontFamily: "var(--font-inter)",
            fontSize: "9px",
            fontWeight: 600,
          }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="inline-block rounded-md px-3 py-2" style={{ background: "var(--cream-25)", border: "1px solid var(--border)" }}>
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <span
              className="text-xs font-medium"
              style={{ fontFamily: "var(--font-inter)", color: "var(--warm-800)" }}
            >
              {comment.author.name}
            </span>
            <span
              className="text-[9px] font-medium uppercase tracking-wider"
              style={{
                color: comment.author.role === "vet" ? "var(--forest-600)" : "var(--warm-400)",
              }}
            >
              {comment.author.role === "vet" ? "Vet" : "Dueño/a"}
            </span>
          </div>
          <p
            className="text-sm leading-relaxed"
            style={{ fontFamily: "var(--font-source-serif)", color: "var(--warm-900)" }}
          >
            {comment.content}
          </p>
        </div>

        {/* Comment actions */}
        <div className="mt-1 flex items-center gap-3 pl-1">
          <time
            className="text-[10px]"
            dateTime={comment.createdAt}
            style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter)" }}
          >
            {timeAgo(comment.createdAt)}
          </time>
          <button
            type="button"
            onClick={toggleLike}
            className="flex items-center gap-1 text-[10px] transition-colors"
            style={{
              color: liked ? "var(--terracotta-600)" : "var(--warm-400)",
              fontFamily: "var(--font-inter)",
            }}
            aria-label={liked ? `Quitar me gusta (${likesCount})` : `Me gusta (${likesCount})`}
            aria-pressed={liked}
          >
            <Heart
              className="h-3 w-3"
              style={{
                fill: liked ? "var(--terracotta-500)" : "transparent",
                stroke: liked ? "var(--terracotta-500)" : "currentColor",
              }}
              aria-hidden="true"
            />
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>
          {depth === 0 && onReply && (
            <button
              type="button"
              onClick={() => onReply(comment.id, comment.author.name)}
              className="text-[10px] transition-colors"
              style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter)" }}
            >
              Responder
            </button>
          )}
        </div>

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
