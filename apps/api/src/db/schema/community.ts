import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./auth.js";
import { postReportReasonEnum, postVisibilityEnum } from "./enums.js";

// ---------------------------------------------------------------------------
// Posts (community feed)
// ---------------------------------------------------------------------------

export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    photoUrl: text("photo_url"),
    visibility: postVisibilityEnum("visibility").notNull().default("public"),
    likesCount: integer("likes_count").notNull().default(0),
    commentsCount: integer("comments_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("posts_author_idx").on(table.authorId),
    index("posts_created_idx").on(table.createdAt),
  ]
);

// ---------------------------------------------------------------------------
// Post likes
// ---------------------------------------------------------------------------

export const postLikes = pgTable(
  "post_likes",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("post_likes_unique").on(table.postId, table.userId),
    index("post_likes_post_idx").on(table.postId),
    index("post_likes_user_idx").on(table.userId),
  ]
);

// ---------------------------------------------------------------------------
// Post reports
// ---------------------------------------------------------------------------

export const postReports = pgTable(
  "post_reports",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: postReportReasonEnum("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("post_reports_post_idx").on(table.postId)]
);

// ---------------------------------------------------------------------------
// Post hides (personal, does not affect others)
// ---------------------------------------------------------------------------

export const postHides = pgTable(
  "post_hides",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("post_hides_unique").on(table.postId, table.userId),
    index("post_hides_user_idx").on(table.userId),
  ]
);

// ---------------------------------------------------------------------------
// Comments (supports nested replies via parent_comment_id)
// ---------------------------------------------------------------------------

export const comments = pgTable(
  "comments",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    parentCommentId: text("parent_comment_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("comments_post_idx").on(table.postId),
    index("comments_parent_idx").on(table.parentCommentId),
  ]
);
