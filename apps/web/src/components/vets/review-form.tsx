"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "./star-rating";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface ReviewFormProps {
  vetId: string;
  onReviewSubmitted: () => void;
}

export function ReviewForm({ vetId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Selecciona una calificacion");
      return;
    }

    if (comment.trim().length < 3) {
      toast.error("Escribe un comentario de al menos 3 caracteres");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/api/vets/${vetId}/reviews`, {
        rating,
        comment: comment.trim(),
      });
      toast.success("Resena enviada");
      setRating(0);
      setComment("");
      onReviewSubmitted();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "ALREADY_REVIEWED") {
          toast.error("Ya dejaste una resena para este veterinario");
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("Error al enviar la resena");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="review-rating">Tu calificacion</Label>
        <StarRating
          value={rating}
          size="lg"
          interactive
          onChange={setRating}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-comment">Comentario</Label>
        <Textarea
          id="review-comment"
          placeholder="Cuenta tu experiencia..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground text-right">
          {comment.length}/500
        </p>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="gap-2"
      >
        <Send className="h-4 w-4" />
        {isSubmitting ? "Enviando..." : "Enviar resena"}
      </Button>
    </form>
  );
}
