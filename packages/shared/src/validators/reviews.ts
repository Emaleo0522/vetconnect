import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int({ message: "Rating must be an integer" })
    .min(1, { message: "Rating must be at least 1" })
    .max(5, { message: "Rating must be at most 5" }),
  comment: z
    .string()
    .min(10, { message: "Comment must be at least 10 characters" })
    .max(500, { message: "Comment must be at most 500 characters" }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = createReviewSchema.partial();

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
