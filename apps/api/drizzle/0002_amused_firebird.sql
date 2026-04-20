CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."contact_preference" AS ENUM('app', 'phone', 'email');--> statement-breakpoint
CREATE TYPE "public"."lost_report_status" AS ENUM('active', 'found', 'closed');--> statement-breakpoint
CREATE TYPE "public"."post_report_reason" AS ENUM('spam', 'inappropriate', 'other');--> statement-breakpoint
CREATE TYPE "public"."post_visibility" AS ENUM('public', 'followers');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'lost_pet' BEFORE 'general';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'sighting' BEFORE 'general';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'community' BEFORE 'general';--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"vaccina_proxima" boolean DEFAULT true NOT NULL,
	"turno_proximo" boolean DEFAULT true NOT NULL,
	"alerta_perdidos" boolean DEFAULT true NOT NULL,
	"comunidad" boolean DEFAULT true NOT NULL,
	"avistamiento" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"pet_id" text NOT NULL,
	"vet_profile_id" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"reason" text,
	"notes" text,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"vet_profile_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lost_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"pet_id" text NOT NULL,
	"description" text NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"last_seen_lat" numeric(10, 7) NOT NULL,
	"last_seen_lng" numeric(10, 7) NOT NULL,
	"status" "lost_report_status" DEFAULT 'active' NOT NULL,
	"contact_preference" "contact_preference" DEFAULT 'app' NOT NULL,
	"reward" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sightings" (
	"id" text PRIMARY KEY NOT NULL,
	"lost_report_id" text NOT NULL,
	"reporter_id" text NOT NULL,
	"description" text NOT NULL,
	"lat" numeric(10, 7) NOT NULL,
	"lng" numeric(10, 7) NOT NULL,
	"photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"parent_comment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_hides" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "post_hides_unique" UNIQUE("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "post_likes" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_likes_unique" UNIQUE("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "post_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"reporter_id" text NOT NULL,
	"reason" "post_report_reason" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"photo_url" text,
	"visibility" "post_visibility" DEFAULT 'public' NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "link" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_vet_profile_id_veterinarian_profiles_id_fk" FOREIGN KEY ("vet_profile_id") REFERENCES "public"."veterinarian_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_vet_profile_id_veterinarian_profiles_id_fk" FOREIGN KEY ("vet_profile_id") REFERENCES "public"."veterinarian_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lost_reports" ADD CONSTRAINT "lost_reports_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lost_reports" ADD CONSTRAINT "lost_reports_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sightings" ADD CONSTRAINT "sightings_lost_report_id_lost_reports_id_fk" FOREIGN KEY ("lost_report_id") REFERENCES "public"."lost_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sightings" ADD CONSTRAINT "sightings_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_hides" ADD CONSTRAINT "post_hides_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_hides" ADD CONSTRAINT "post_hides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_user_idx" ON "appointments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "appointments_vet_idx" ON "appointments" USING btree ("vet_profile_id");--> statement-breakpoint
CREATE INDEX "appointments_scheduled_idx" ON "appointments" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "favorites_user_idx" ON "favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "favorites_vet_idx" ON "favorites" USING btree ("vet_profile_id");--> statement-breakpoint
CREATE INDEX "lost_reports_owner_idx" ON "lost_reports" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "lost_reports_status_idx" ON "lost_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lost_reports_created_idx" ON "lost_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sightings_report_idx" ON "sightings" USING btree ("lost_report_id");--> statement-breakpoint
CREATE INDEX "comments_post_idx" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "comments_parent_idx" ON "comments" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE INDEX "post_hides_user_idx" ON "post_hides" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "post_likes_post_idx" ON "post_likes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_likes_user_idx" ON "post_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "post_reports_post_idx" ON "post_reports" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "posts_author_idx" ON "posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "posts_created_idx" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_archived_idx" ON "notifications" USING btree ("user_id","is_archived");