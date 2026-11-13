import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp, { type Sharp } from "sharp";

export const mediaFolders = ["destinations", "universities", "gallery", "courses", "banners", "general"] as const;
export type MediaFolderName = (typeof mediaFolders)[number];
const maxBytes = 100 * 1024 * 1024;
const videoTypes = new Map([[".mp4", "video/mp4"], [".webm", "video/webm"], [".mov", "video/quicktime"]]);
const categoryEnum: Record<MediaFolderName, "DESTINATIONS" | "UNIVERSITIES" | "GALLERY" | "COURSES" | "BANNERS" | "GENERAL"> = {
  destinations: "DESTINATIONS", universities: "UNIVERSITIES", gallery: "GALLERY", courses: "COURSES", banners: "BANNERS", general: "GENERAL",
};
const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/tiff"]);

export async function storeLocalMedia(file: File, folder: MediaFolderName) {
  if (!file.size || file.size > maxBytes) throw new Error("Files must be between 1 byte and 100 MB.");
  const extension = path.extname(file.name).toLowerCase();
  const root = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads"));
  const folderPath = path.resolve(root, folder);
  if (!folderPath.startsWith(`${root}${path.sep}`)) throw new Error("Invalid storage category.");
  await mkdir(folderPath, { recursive: true });
  const input = Buffer.from(await file.arrayBuffer());
  const id = randomUUID();
  if (acceptedImageTypes.has(file.type)) {
    let image: Sharp;
    try { image = sharp(input, { limitInputPixels: 50_000_000 }); await image.metadata(); }
    catch { throw new Error("The uploaded image is invalid."); }
    const filename = `${id}.webp`;
    const thumbnailFilename = `${id}-thumb.webp`;
    const thumbnailDir = path.join(folderPath, "thumbs");
    await mkdir(thumbnailDir, { recursive: true });
    const metadata = await image.metadata();
    await Promise.all([
      image.clone().rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toFile(path.join(folderPath, filename)),
      image.clone().rotate().resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true }).webp({ quality: 76 }).toFile(path.join(thumbnailDir, thumbnailFilename)),
    ]);
    return { url: `${folder}/${filename}`, thumbnailPath: `${folder}/thumbs/${thumbnailFilename}`, name: file.name, mimeType: "image/webp", size: file.size, width: metadata.width, height: metadata.height, folder: categoryEnum[folder] };
  }
  if (videoTypes.get(extension) !== file.type) throw new Error("Choose a JPEG, PNG, WebP, GIF, AVIF or TIFF image, or MP4, WebM or MOV video.");
  const isMp4 = extension === ".mp4" || extension === ".mov";
  const hasMp4Signature = input.length > 11 && input.toString("ascii", 4, 8) === "ftyp";
  const hasWebmSignature = input.length > 4 && input.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if ((isMp4 && !hasMp4Signature) || (extension === ".webm" && !hasWebmSignature)) throw new Error("The uploaded video does not match its file type.");
  const filename = `${id}${extension}`;
  await writeFile(path.join(folderPath, filename), input, { flag: "wx" });
  return { url: `${folder}/${filename}`, thumbnailPath: null, name: file.name, mimeType: file.type, size: file.size, width: null, height: null, folder: categoryEnum[folder] };
}

export function localMediaRoot() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads"));
}

export async function deleteLocalMediaFiles(paths: Array<string | null | undefined>) {
  const { unlink } = await import("node:fs/promises");
  const root = localMediaRoot();
  for (const relative of paths.filter((value): value is string => Boolean(value))) {
    const target = path.resolve(root, relative);
    if (!target.startsWith(`${root}${path.sep}`)) throw new Error("Invalid stored media path.");
    await unlink(target).catch(error => { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; });
  }
}
