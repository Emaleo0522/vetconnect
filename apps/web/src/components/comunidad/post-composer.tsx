"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ImagePlus, X, Loader2, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

interface PostComposerProps {
  onPostCreated: () => void;
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar 5MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    setError(null);

    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("content", trimmed);
        formData.append("image", imageFile);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/community/posts`,
          { method: "POST", body: formData, credentials: "include" }
        );
        if (!res.ok) throw new Error("Error al publicar");
      } else {
        await api.post("/api/community/posts", { content: trimmed });
      }
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      onPostCreated();
    } catch {
      setError("No se pudo publicar. Intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = content.trim().length > 0 && !isSubmitting;

  return (
    <div
      className="rounded-md bg-white p-4"
      style={{ border: "1px solid var(--border)" }}
    >
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <Avatar className="h-9 w-9 shrink-0">
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

          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Compartí un tip, pregunta o historia..."
              rows={3}
              className="w-full resize-none rounded-md border-0 bg-transparent p-0 text-sm outline-none placeholder:italic"
              style={{
                fontFamily: "var(--font-source-serif)",
                color: "var(--warm-900)",
                lineHeight: 1.6,
              }}
              maxLength={2000}
              aria-label="Contenido de la publicación"
            />

            {/* Image preview */}
            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <div className="relative h-32 w-32 overflow-hidden rounded-md" style={{ border: "1px solid var(--border)" }}>
                  <Image
                    src={imagePreview}
                    alt="Previsualización de imagen"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: "var(--warm-900)", color: "var(--cream-50)" }}
                  aria-label="Quitar imagen"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            )}

            {error && (
              <p
                className="mt-2 text-xs"
                style={{ color: "var(--terracotta-700)", fontFamily: "var(--font-inter)" }}
                role="alert"
              >
                {error}
              </p>
            )}

            {/* Actions row */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  id="post-image-upload"
                  onChange={handleImageChange}
                  aria-label="Adjuntar imagen"
                />
                <label
                  htmlFor="post-image-upload"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded transition-colors hover:bg-cream-50"
                  style={{ color: "var(--warm-400)" }}
                  title="Adjuntar imagen"
                >
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                </label>
                {content.length > 1800 && (
                  <span
                    className="text-xs"
                    style={{ color: content.length > 1950 ? "var(--terracotta-700)" : "var(--warm-400)", fontFamily: "var(--font-inter)" }}
                    aria-live="polite"
                  >
                    {2000 - content.length} restantes
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-40"
                style={{
                  background: canSubmit ? "var(--forest-900)" : "var(--warm-200)",
                  color: canSubmit ? "var(--cream-50)" : "var(--warm-400)",
                  fontFamily: "var(--font-inter)",
                  cursor: canSubmit ? "pointer" : "not-allowed",
                }}
                aria-label="Publicar"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Publicar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
