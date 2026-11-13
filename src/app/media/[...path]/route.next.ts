import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { localMediaRoot, mediaFolders } from "@/lib/local-storage";

export const runtime = "nodejs";
const knownTypes: Record<string, string> = { ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime" };
export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await context.params;
  if (!parts || parts.length < 2 || parts.length > 3 || !mediaFolders.includes(parts[0] as (typeof mediaFolders)[number]) || parts.some(part => part === "." || part === ".." || !/^[a-zA-Z0-9._-]+$/.test(part))) return new NextResponse("Not found", { status: 404 });
  const filename = parts.at(-1)!; const contentType = knownTypes[path.extname(filename).toLowerCase()];
  if (!contentType) return new NextResponse("Not found", { status: 404 });
  const root = localMediaRoot(); const target = path.resolve(root, ...parts);
  if (!target.startsWith(`${root}${path.sep}`)) return new NextResponse("Not found", { status: 404 });
  try { return new NextResponse(await readFile(target), { headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } }); }
  catch { return new NextResponse("Not found", { status: 404 }); }
}
