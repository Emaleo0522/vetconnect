"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Send, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { PostCard, type Post } from "@/components/comunidad/post-card";
import { CommentItem, type Comment } from "@/components/comunidad/comment-item";
import { PostSkeleton } from "@/components/comunidad/post-skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/auth";

interface PostDetailResponse {
  post: Post;
  comments: Comment[];
}

export default function ComunidadPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comment form state
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<PostDetailResponse>(`/api/community/posts/${id}`);
      setPost(data.post);
      setComments(data.comments ?? []);
    } catch {
      setError("No se pudo cargar la publicación.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchPost();
  }, [id, fetchPost]);

  function handleReply(commentId: string, authorName: string) {
    setReplyTo({ id: commentId, name: authorName });
    setCommentText(`@${authorName} `);
    commentInputRef.current?.focus();
  }

  function clearReply() {
    setReplyTo(null);
    setCommentText("");
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload: { content: string; parentId?: string } = { content: trimmed };
      if (replyTo) payload.parentId = replyTo.id;
      await api.post(`/api/community/posts/${id}/comments`, payload);
      setCommentText("");
      setReplyTo(null);
      // Refetch to get updated comments
      const data = await api.get<PostDetailResponse>(`/api/community/posts/${id}`);
      setPost(data.post);
      setComments(data.comments ?? []);
    } catch {
      setSubmitError("No se pudo enviar el comentario.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: "var(--warm-500)", fontFamily: "var(--font-inter)" }}
        aria-label="Volver al feed"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver
      </button>

      {/* Post */}
      {isLoading ? (
        <PostSkeleton />
      ) : error ? (
        <div
          className="rounded-md px-4 py-8 text-center"
          style={{ border: "1px solid var(--border)", background: "var(--cream-25)" }}
        >
          <p
            className="italic"
            style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-600)" }}
          >
            {error}
          </p>
          <button
            type="button"
            onClick={fetchPost}
            className="mt-3 rounded-md px-4 py-2 text-sm"
            style={{
              background: "var(--forest-900)",
              color: "var(--cream-50)",
              fontFamily: "var(--font-inter)",
            }}
          >
            Reintentar
          </button>
        </div>
      ) : post ? (
        <>
          <PostCard
            post={post}
            currentUserId={user?.id}
            onHide={() => router.back()}
          />

          {/* Comments section */}
          <section aria-label="Comentarios">
            <h2
              className="mb-3 flex items-center gap-2 text-base font-medium italic"
              style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-800)" }}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {comments.length === 0 ? "Sin comentarios" : `${comments.length} comentario${comments.length !== 1 ? "s" : ""}`}
            </h2>

            {comments.length > 0 && (
              <div className="space-y-3 mb-4" aria-live="polite">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    postId={id}
                    onReply={handleReply}
                  />
                ))}
              </div>
            )}

            {/* Comment form */}
            <div
              className="rounded-md bg-white p-3"
              style={{ border: "1px solid var(--border)" }}
            >
              {replyTo && (
                <div
                  className="mb-2 flex items-center justify-between rounded px-2 py-1.5"
                  style={{ background: "var(--cream-50)", border: "1px solid var(--border)" }}
                >
                  <span
                    className="text-xs"
                    style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
                  >
                    Respondiendo a <strong>{replyTo.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={clearReply}
                    className="text-xs transition-colors"
                    style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter)" }}
                    aria-label="Cancelar respuesta"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback
                    style={{
                      background: "var(--forest-900)",
                      color: "var(--cream-50)",
                      fontFamily: "var(--font-inter)",
                      fontSize: "9px",
                      fontWeight: 600,
                    }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-1 items-end gap-2">
                  <textarea
                    ref={commentInputRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={replyTo ? `Respondiendo a ${replyTo.name}...` : "Escribí un comentario..."}
                    rows={2}
                    className="flex-1 resize-none rounded-md border px-3 py-2 text-sm outline-none"
                    style={{
                      fontFamily: "var(--font-source-serif)",
                      color: "var(--warm-900)",
                      borderColor: "var(--border)",
                      background: "var(--cream-25)",
                      lineHeight: 1.5,
                    }}
                    maxLength={1000}
                    aria-label="Texto del comentario"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        handleSubmitComment(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmitting}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-40"
                    style={{
                      background: commentText.trim() ? "var(--forest-900)" : "var(--warm-200)",
                      color: commentText.trim() ? "var(--cream-50)" : "var(--warm-400)",
                    }}
                    aria-label="Enviar comentario"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </form>

              {submitError && (
                <p
                  className="mt-2 text-xs"
                  style={{ color: "var(--terracotta-700)", fontFamily: "var(--font-inter)" }}
                  role="alert"
                >
                  {submitError}
                </p>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
