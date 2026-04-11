import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./auth.js";

export const veterinaryReviews = pgTable(
  "veterinary_reviews",
  {
    id: text("id").primaryKey(),
    vetId: text("vet_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reviewerId: text("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1-5, validated in service layer
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("reviews_vet_idx").on(table.vetId),
    unique("unique_review").on(table.vetId, table.reviewerId),
  ]
);
