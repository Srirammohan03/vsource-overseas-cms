import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/permissions";
import { deleteLocalMediaFiles, mediaFolders, storeLocalMedia, type MediaFolderName } from "@/lib/storage/local";

export const runtime = "nodejs";
const imageFolder = (value: string): MediaFolderName => value.toLowerCase() as MediaFolderName;
const referencesPath = (value: unknown, target: string): boolean => {
  if (typeof value === "string") return value === target;
  if (Array.isArray(value)) return value.some(item => referencesPath(item, target));
  if (value && typeof value === "object") return Object.values(value).some(item => referencesPath(item, target));
  return false;
};
async function hasPublishedReference(url: string, mediaId: string) {
  const [gallery, university, destinationPages, destinationSections, universitySections] = await Promise.all([
    prisma.galleryMedia.count({ where: { mediaId, gallery: { status: "PUBLISHED" } } }),
    prisma.universityGallery.count({ where: { mediaId, university: { status: "PUBLISHED" } } }),
    prisma.destinationPage.findMany({ select: { content: true } }),
    prisma.destinationSection.findMany({ select: { content: true } }),
    prisma.universityPageSection.findMany({ select: { content: true } }),
  ]);
  if (gallery || university) return true;
  const [universities,] = await Promise.all([prisma.university.findMany({ select: { content: true, logo: true, banner: true } })]);
  return [...destinationPages, ...destinationSections, ...universitySections, ...universities].some(record => Object.values(record).some(value => referencesPath(value, url)));
}
function replaceMediaPath(value: unknown, from: string, to: string): unknown {
  if (value === from) return to;
  if (Array.isArray(value)) return value.map(item => replaceMediaPath(item, from, to));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceMediaPath(item, from, to)]));
  return value;
}

export async function GET(request: Request) {
  const access = await requireApiRole(); if (access.response) return access.response;
  const query = new URL(request.url).searchParams;
  const page = Math.min(100000, Math.max(1, Number(query.get("page") || 1)));
  const search = query.get("search")?.trim(); const folder = query.get("folder")?.toUpperCase();
  if (folder && !["DESTINATIONS", "UNIVERSITIES", "GALLERY", "COURSES", "BANNERS", "GENERAL"].includes(folder)) return NextResponse.json({ error: "Invalid media folder." }, { status: 400 });
  const where = { ...(folder ? { folder: folder as any } : {}), ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { altText: { contains: search, mode: "insensitive" as const } }] } : {}) };
  const [items, total] = await Promise.all([prisma.media.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 40, take: 40 }), prisma.media.count({ where })]);
  return NextResponse.json({ items, total, page, pageCount: Math.ceil(total / 40) });
}

export async function POST(request: Request) {
  const access = await requireApiRole(); if (access.response) return access.response;
  const form = await request.formData(); const folderValue = String(form.get("folder") || "general");
  if (!mediaFolders.includes(folderValue as MediaFolderName)) return NextResponse.json({ error: "Invalid media folder." }, { status: 400 });
  const files = form.getAll("files").filter((item): item is File => item instanceof File);
  if (!files.length || files.length > 20) return NextResponse.json({ error: "Upload between 1 and 20 files." }, { status: 400 });
  if (folderValue === "gallery" && files.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) return NextResponse.json({ error: "Gallery accepts JPG, JPEG, PNG and WebP images only." }, { status: 400 });
  if (files.reduce((total, file) => total + file.size, 0) > 200 * 1024 * 1024) return NextResponse.json({ error: "The combined upload limit is 200 MB." }, { status: 413 });
  const parsedAlt = z.string().max(500).safeParse(String(form.get("altText") || ""));
  if (!parsedAlt.success) return NextResponse.json({ error: "Alt text must be 500 characters or fewer." }, { status: 400 });
  const created: Array<{ id: string; url: string; thumbnailPath: string | null }> = [];
  try {
    for (const file of files) {
      const stored = await storeLocalMedia(file, folderValue as MediaFolderName);
      try {
        const media = await prisma.media.create({ data: { ...stored, altText: parsedAlt.data } });
        created.push({ id: media.id, url: media.url, thumbnailPath: media.thumbnailPath });
      } catch (error) { await deleteLocalMediaFiles([stored.url, stored.thumbnailPath]); throw error; }
    }
    return NextResponse.json(await prisma.media.findMany({ where: { id: { in: created.map(item => item.id) } } }), { status: 201 });
  } catch (error) {
    await prisma.media.deleteMany({ where: { id: { in: created.map(item => item.id) } } });
    await Promise.all(created.map(item => deleteLocalMediaFiles([item.url, item.thumbnailPath]).catch(() => undefined)));
    console.error("Local media upload failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const access = await requireApiRole(); if (access.response) return access.response;
  const parsed = z.object({ id: z.string().min(1), altText: z.string().max(500) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "A media id and valid alt text are required." }, { status: 400 });
  const media = await prisma.media.update({ where: { id: parsed.data.id }, data: { altText: parsed.data.altText }, select: { id: true, altText: true } });
  return NextResponse.json(media);
}

export async function PUT(request: Request) {
  const access = await requireApiRole("ADMIN"); if (access.response) return access.response;
  const form = await request.formData(); const id = String(form.get("id") || ""); const file = form.get("file");
  if (!(file instanceof File) || !id) return NextResponse.json({ error: "A media record and replacement file are required." }, { status: 400 });
  const existing = await prisma.media.findUnique({ where: { id } }); if (!existing) return NextResponse.json({ error: "Media record not found." }, { status: 404 });
  if ((existing.folder === "GALLERY" || existing.mimeType.startsWith("image/")) && !(file.type.startsWith("image/") && ["image/jpeg", "image/png", "image/webp"].includes(file.type))) return NextResponse.json({ error: "Replace this file with a JPG, PNG or WebP image." }, { status: 400 });
  let stored: Awaited<ReturnType<typeof storeLocalMedia>> | null = null;
  try {
    stored = await storeLocalMedia(file, imageFolder(existing.folder));
    const [destinationPages, destinationSections, universities, universitySections] = await Promise.all([
      prisma.destinationPage.findMany({ select: { id: true, content: true } }), prisma.destinationSection.findMany({ select: { id: true, content: true } }),
      prisma.university.findMany({ select: { id: true, content: true, logo: true, banner: true } }), prisma.universityPageSection.findMany({ select: { id: true, content: true } }),
    ]);
    const updated = await prisma.$transaction(async tx => {
      const result = await tx.media.update({ where: { id }, data: { url: stored!.url, thumbnailPath: stored!.thumbnailPath, name: stored!.name, mimeType: stored!.mimeType, size: stored!.size, width: stored!.width, height: stored!.height }, select: { id: true, url: true, thumbnailPath: true, name: true, mimeType: true, size: true, width: true, height: true, altText: true, folder: true } });
      for (const row of destinationPages) await tx.destinationPage.update({ where: { id: row.id }, data: { content: replaceMediaPath(replaceMediaPath(row.content, existing.url, stored!.url), existing.thumbnailPath || "", stored!.thumbnailPath || "") as any } });
      for (const row of destinationSections) await tx.destinationSection.update({ where: { id: row.id }, data: { content: replaceMediaPath(replaceMediaPath(row.content, existing.url, stored!.url), existing.thumbnailPath || "", stored!.thumbnailPath || "") as any } });
      for (const row of universities) {
        const data: any = { content: replaceMediaPath(replaceMediaPath(row.content, existing.url, stored!.url), existing.thumbnailPath || "", stored!.thumbnailPath || "") };
        if (row.logo !== null) data.logo = replaceMediaPath(replaceMediaPath(row.logo, existing.url, stored!.url), existing.thumbnailPath || "", stored!.thumbnailPath || "");
        if (row.banner !== null) data.banner = replaceMediaPath(replaceMediaPath(row.banner, existing.url, stored!.url), existing.thumbnailPath || "", stored!.thumbnailPath || "");
        await tx.university.update({ where: { id: row.id }, data });
      }
      for (const row of universitySections) await tx.universityPageSection.update({ where: { id: row.id }, data: { content: replaceMediaPath(replaceMediaPath(row.content, existing.url, stored!.url), existing.thumbnailPath || "", stored!.thumbnailPath || "") as any } });
      return result;
    });
    await deleteLocalMediaFiles([existing.url, existing.thumbnailPath]);
    return NextResponse.json(updated);
  } catch (error) {
    if (stored) await deleteLocalMediaFiles([stored.url, stored.thumbnailPath]).catch(() => undefined);
    console.error("Media replacement failed", error); return NextResponse.json({ error: error instanceof Error ? error.message : "Replacement failed." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const access = await requireApiRole("ADMIN"); if (access.response) return access.response;
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "A media id is required." }, { status: 400 });
  const media = await prisma.media.findUnique({ where: { id: parsed.data.id }, include: { galleryItems: true, universityImages: true } });
  if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });
  const referencedByDraft = media.galleryItems.length > 0 || media.universityImages.length > 0;
  if (referencedByDraft || await hasPublishedReference(media.url, media.id)) return NextResponse.json({ error: "This file is still referenced by published or draft content. Remove it from that content first." }, { status: 409 });
  await prisma.media.delete({ where: { id: media.id } });
  try { await deleteLocalMediaFiles([media.url, media.thumbnailPath]); }
  catch (error) { console.error("Deleted media record but a storage file needs cleanup", error); return NextResponse.json({ error: "Media record deleted; file cleanup needs administrator attention." }, { status: 500 }); }
  return NextResponse.json({ success: true });
}
