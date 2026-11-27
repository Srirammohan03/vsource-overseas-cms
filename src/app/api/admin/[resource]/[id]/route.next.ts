import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/permissions";
import { coursePatchSchema, destinationInputSchema, galleryInputSchema, officeGalleryInputSchema, universityInputSchema } from "@/features/cms/schemas";

const countries = [{ name: "UK", code: "UK" }, { name: "USA", code: "USA" }, { name: "Canada", code: "CANADA" }, { name: "Ireland", code: "IRELAND" }, { name: "France", code: "FRANCE" }];
const toJson = (value: unknown) => value as Prisma.InputJsonValue;
const errorResponse = (error: unknown) => {
  if (error instanceof z.ZodError) return NextResponse.json({ error: "Please correct the highlighted fields.", details: error.flatten() }, { status: 400 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "That slug or unique value is already in use." }, { status: 409 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return NextResponse.json({ error: "The selected relationship is invalid." }, { status: 400 });
  console.error("CMS update failed", error); return NextResponse.json({ error: "The record could not be updated." }, { status: 500 });
};
async function saveSeo(owner: { destinationId?: string; galleryId?: string }, seo?: { title?: string; description?: string; canonicalUrl?: string; keywords?: string[]; ogImage?: string }) {
  if (!seo) return;
  const values = { title: seo.title || null, description: seo.description || null, canonicalUrl: seo.canonicalUrl || null, keywords: seo.keywords, ogImage: seo.ogImage || null };
  if (owner.destinationId) await prisma.seoMetadata.upsert({ where: { destinationId: owner.destinationId }, create: { destinationId: owner.destinationId, ...values }, update: values });
  if (owner.galleryId) await prisma.seoMetadata.upsert({ where: { galleryId: owner.galleryId }, create: { galleryId: owner.galleryId, ...values }, update: values });
}

export async function PATCH(request: Request, context: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await context.params;
  const access = await requireApiRole(resource === "users" || resource === "settings" ? "SUPER_ADMIN" : "EDITOR"); if (access.response) return access.response;
  try {
    const raw = await request.json();
    if (resource === "destinations") {
      const data = destinationInputSchema.parse(raw); const country = countries.find(item => item.name.toLowerCase() === data.country.toLowerCase());
      if (!country) return NextResponse.json({ error: "Select a supported study destination." }, { status: 400 });
      const countryRecord = await prisma.country.upsert({ where: { code: country.code }, create: country, update: { name: country.name } });
      const page = await prisma.destinationPage.update({ where: { id }, data: { slug: data.slug, title: data.title, content: toJson(data.content), status: data.status, countryId: countryRecord.id } });
      await saveSeo({ destinationId: id }, data.seo);
      return NextResponse.json(page);
    }
    if (resource === "universities") {
      const data = universityInputSchema.parse(raw); const country = countries.find(item => item.name.toLowerCase() === data.country.toLowerCase());
      if (!country) return NextResponse.json({ error: "Select a supported country." }, { status: 400 });
      const countryRecord = await prisma.country.upsert({ where: { code: country.code }, create: country, update: { name: country.name } });
      const university = await prisma.university.update({ where: { id }, data: { slug: data.slug, name: data.name, campus: data.campus, website: data.website, logo: data.logo ? toJson(data.logo) : Prisma.DbNull, banner: data.banner ? toJson(data.banner) : Prisma.DbNull, content: toJson(data.content), status: data.status, countryId: countryRecord.id } });
      return NextResponse.json(university);
    }
    if (resource === "gallery") {
      const data = galleryInputSchema.parse(raw); const categoryName = data.category.trim(); const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const category = categoryName ? await prisma.galleryCategory.upsert({ where: { slug: categorySlug }, create: { name: categoryName, slug: categorySlug }, update: { name: categoryName } }) : null;
      const mediaIds = data.media.map(file => file.id); const mediaRows = mediaIds.length ? await prisma.media.findMany({ where: { id: { in: mediaIds } }, select: { id: true, mimeType: true } }) : [];
      if (new Set(mediaIds).size !== mediaIds.length || mediaRows.length !== mediaIds.length) return NextResponse.json({ error: "One or more selected media files are invalid or duplicated." }, { status: 400 });
      if (mediaRows.some(file => !file.mimeType.startsWith("image/"))) return NextResponse.json({ error: "Gallery items can contain images only." }, { status: 400 });
      await prisma.gallery.update({ where: { id }, data: { slug: data.slug, title: data.title, description: data.description, status: data.status, order: data.order, categoryId: category?.id || null, mediaIds } });
      await prisma.$transaction([prisma.galleryMedia.deleteMany({ where: { galleryId: id } }), ...data.media.map((file, order) => prisma.galleryMedia.create({ data: { galleryId: id, mediaId: file.id, order } })), ...data.media.map(file => prisma.media.update({ where: { id: file.id }, data: { altText: file.altText } }))]);
      return NextResponse.json(await prisma.gallery.findUnique({ where: { id }, include: { category: true, media: { include: { media: true }, orderBy: { order: "asc" } } } }));
    }
    if (resource === "office-gallery") {
      const data = officeGalleryInputSchema.parse(raw);
      if (!await prisma.officeGallery.findUnique({ where: { id }, select: { id: true } })) {
        return NextResponse.json({ error: "Office gallery record not found." }, { status: 404 });
      }
      const mediaIds = data.media.map((file) => file.id);
      const mediaRows = mediaIds.length
        ? await prisma.media.findMany({
            where: { id: { in: mediaIds } },
            select: { id: true, mimeType: true },
          })
        : [];
      if (new Set(mediaIds).size !== mediaIds.length || mediaRows.length !== mediaIds.length) {
        return NextResponse.json({ error: "One or more selected images are unavailable or duplicated." }, { status: 400 });
      }
      if (mediaRows.some((file) => !file.mimeType.startsWith("image/"))) {
        return NextResponse.json({ error: "Office gallery entries can contain images only." }, { status: 400 });
      }
      const record = await prisma.$transaction(async (tx) => {
        await tx.officeGallery.update({
          where: { id },
          data: {
            branch: data.branch,
            area: data.area,
            status: data.status,
          },
        });
        await tx.officeGalleryMedia.deleteMany({ where: { officeGalleryId: id } });
        for (const [order, file] of data.media.entries()) {
          await tx.officeGalleryMedia.create({
            data: { officeGalleryId: id, mediaId: file.id, order },
          });
          await tx.media.update({
            where: { id: file.id },
            data: { altText: file.altText },
          });
        }
        return tx.officeGallery.findUnique({
          where: { id },
          include: { media: { include: { media: true }, orderBy: { order: "asc" } } },
        });
      });
      return NextResponse.json(record);
    }
    if (resource === "courses") {
      const data = coursePatchSchema.parse(raw);
      if (data.universityId && !await prisma.university.findUnique({ where: { id: data.universityId }, select: { id: true } })) return NextResponse.json({ error: "Select an existing university." }, { status: 400 });
      return NextResponse.json(await prisma.universityCourse.update({ where: { id }, data }));
    }
    if (resource === "users") {
      const data = z.object({ name: z.string().trim().min(1).max(120).optional(), role: z.enum(["ADMIN", "EDITOR"]).optional(), isActive: z.boolean().optional(), password: z.string().min(12).max(128).refine(value => new TextEncoder().encode(value).length <= 72).optional() }).refine(value => Object.keys(value).length > 0).parse(raw);
      if (id === access.user!.id && data.role) return NextResponse.json({ error: "Change your own role from another Super Admin account." }, { status: 409 });
      if (id === access.user!.id && data.isActive === false) return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 409 });
      const result = await prisma.user.update({ where: { id }, data: { name: data.name, role: data.role, isActive: data.isActive, ...(data.password ? { passwordHash: await hash(data.password, 12) } : {}) }, select: { id: true, name: true, email: true, role: true, isActive: true, updatedAt: true } });
      return NextResponse.json(result);
    }
    if (resource === "settings") {
      const data = z.object({ value: z.string().max(10000) }).parse(raw);
      return NextResponse.json(await prisma.siteSetting.update({ where: { key: id }, data: { value: data.value } }));
    }
    return NextResponse.json({ error: "Unknown module." }, { status: 404 });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await context.params; const access = await requireApiRole(resource === "users" ? "SUPER_ADMIN" : "ADMIN"); if (access.response) return access.response;
  try {
    if (resource === "destinations") await prisma.destinationPage.delete({ where: { id } });
    else if (resource === "universities") await prisma.university.delete({ where: { id } });
    else if (resource === "gallery") await prisma.gallery.delete({ where: { id } });
    else if (resource === "office-gallery") {
      if (!await prisma.officeGallery.findUnique({ where: { id }, select: { id: true } })) {
        return NextResponse.json({ error: "Office gallery record not found." }, { status: 404 });
      }
      await prisma.officeGallery.delete({ where: { id } });
    }
    else if (resource === "courses") await prisma.universityCourse.delete({ where: { id } });
    else if (resource === "users") {
      if (id === access.user!.id) return NextResponse.json({ error: "You cannot delete your own account." }, { status: 409 });
      const target = await prisma.user.findUnique({ where: { id }, select: { role: true, isActive: true } });
      if (target?.role === "SUPER_ADMIN" && target.isActive && await prisma.user.count({ where: { role: "SUPER_ADMIN", isActive: true } }) <= 1) return NextResponse.json({ error: "At least one active Super Admin must remain." }, { status: 409 });
      await prisma.user.delete({ where: { id } });
    } else return NextResponse.json({ error: "Unknown module." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) { return errorResponse(error); }
}
