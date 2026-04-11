import { writeFile, mkdir } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Absolute path to uploads directory (apps/api/uploads/) */
const UPLOADS_ROOT = resolve(__dirname, "../../uploads");

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class UploadError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "UploadError";
  }
}

// ---------------------------------------------------------------------------
// saveAvatar — receives a File from Hono parseBody, validates, and saves
// ---------------------------------------------------------------------------

export async function saveAvatar(
  file: File,
  userId: string
): Promise<string> {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new UploadError(
      `Invalid file type: ${file.type}. Allowed: jpg, png, webp`
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError(
      `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 5MB`
    );
  }

  // Determine extension from MIME type (ignore original extension for security)
  const ext = MIME_TO_EXT[file.type] ?? extname(file.name);

  // Ensure directory exists
  const avatarDir = resolve(UPLOADS_ROOT, "avatars");
  await mkdir(avatarDir, { recursive: true });

  // Write file
  const filename = `${userId}${ext}`;
  const filepath = resolve(avatarDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  // Return relative URL path
  return `/uploads/avatars/${filename}`;
}
