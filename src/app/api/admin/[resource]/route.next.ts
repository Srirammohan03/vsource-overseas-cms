import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/permissions";
import { courseInputSchema, destinationInputSchema, galleryInputSchema, officeGalleryInputSchema, universityInputSchema, userCreateSchema, statusSchema } from "@/features/cms/schemas";

const countries = [{ name: "UK", code: "UK" }, { name: "USA", code: "USA" }, { name: "Canada", code: "CANADA" }, { name: "Ireland", code: "IRELAND" }, { name: "France", code: "FRANCE" }];
const fail = (error: unknown, action: string) => {
  if (error instanceof z.ZodError) return NextResponse.json({ error: "Please correct the highlighted fields.", details: error.flatten() }, { status: 400 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "That slug or unique value is already in use." }, { status: 409 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return NextResponse.json({ error: "The selected relationship is invalid." }, { status: 400 });
  console.error(`${action} failed`, error); return NextResponse.json({ error: "The record could not be saved." }, { status: 500 });
};
function toJson(value: unknown) { return value as Prisma.InputJsonValue; }
async function getCountry(name: string) {
  const record = countries.find(country => country.name.toLowerCase() === name.toLowerCase());
  if (!record) return null;
  return prisma.country.upsert({ where: { code: record.code }, create: record, update: { name: record.name } });
}
async function saveSeo(owner: { destinationId?: string; galleryId?: string }, seo?: { title?: string; description?: string; canonicalUrl?: string; keywords?: string[]; ogImage?: string }) {
  if (!seo) return;
  const values = { title: seo.title || null, description: seo.description || null, canonicalUrl: seo.canonicalUrl || null, keywords: seo.keywords, ogImage: seo.ogImage || null };
  if (owner.destinationId) await prisma.seoMetadata.upsert({ where: { destinationId: owner.destinationId }, create: { destinationId: owner.destinationId, ...values }, update: values });
  else if (owner.galleryId) await prisma.seoMetadata.upsert({ where: { galleryId: owner.galleryId }, create: { galleryId: owner.galleryId, ...values }, update: values });
}

export async function GET(request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  const access = await requireApiRole(resource === "users" || resource === "settings" ? "SUPER_ADMIN" : "EDITOR"); if (access.response) return access.response;
  try {
    if (resource === "destinations") return NextResponse.json(await prisma.destinationPage.findMany({ include: { country: true, sections: { orderBy: { order: "asc" } }, seo: true }, orderBy: { updatedAt: "desc" } }));
    if (resource === "universities") return NextResponse.json(await prisma.university.findMany({ include: { country: true, courses: { orderBy: { order: "asc" } }, sections: { orderBy: { order: "asc" } }, gallery: { include: { media: true }, orderBy: { order: "asc" } } }, orderBy: { updatedAt: "desc" } }));
    if (resource === "gallery") return NextResponse.json(await prisma.gallery.findMany({ include: { category: true, media: { include: { media: true }, orderBy: { order: "asc" } }, seo: true }, orderBy: [{ order: "asc" }, { updatedAt: "desc" }] }));
    if (resource === "office-gallery") return NextResponse.json(await prisma.officeGallery.findMany({ include: { media: { include: { media: true }, orderBy: { order: "asc" } } }, orderBy: [{ branch: "asc" }, { area: "asc" }] }));
    if (resource === "courses") return NextResponse.json(await prisma.universityCourse.findMany({ include: { university: { select: { id: true, name: true, slug: true, country: { select: { name: true } } } } }, orderBy: [{ university: { name: "asc" } }, { order: "asc" }] }));
    if (resource === "users") return NextResponse.json(await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true }, orderBy: { createdAt: "asc" } }));
    if (resource === "settings") return NextResponse.json(await prisma.siteSetting.findMany({ orderBy: { key: "asc" } }));
    return NextResponse.json({ error: "Unknown module." }, { status: 404 });
  } catch (error) { return fail(error, "CMS list"); }
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  const access = await requireApiRole(resource === "users" || resource === "settings" ? "SUPER_ADMIN" : "EDITOR"); if (access.response) return access.response;
  try {
    const raw = await request.json();
    if (resource === "destinations") {
      const data = destinationInputSchema.parse(raw); const country = await getCountry(data.country);
      if (!country) return NextResponse.json({ error: "Select a supported study destination." }, { status: 400 });
      const existing = await prisma.destinationPage.findUnique({ where: { countryId: country.id }, select: { id: true } });
      const values = { slug: data.slug, title: data.title, content: toJson(data.content), status: data.status, countryId: country.id };
      const page = existing ? await prisma.destinationPage.update({ where: { id: existing.id }, data: values }) : await prisma.destinationPage.create({ data: values });
      await saveSeo({ destinationId: page.id }, data.seo);
      return NextResponse.json(page, { status: existing ? 200 : 201 });
    }
    if (resource === "universities") {
      const data = universityInputSchema.parse(raw); const country = await getCountry(data.country);
      if (!country) return NextResponse.json({ error: "Select a supported country." }, { status: 400 });
      const values = { slug: data.slug, name: data.name, campus: data.campus, website: data.website, logo: data.logo ? toJson(data.logo) : Prisma.DbNull, banner: data.banner ? toJson(data.banner) : Prisma.DbNull, content: toJson(data.content), status: data.status, countryId: country.id };
      const university = await prisma.university.create({ data: values });
      return NextResponse.json(university, { status: 201 });
    }
    if (resource === "gallery") {
      const data = galleryInputSchema.parse(raw); const categoryName = data.category.trim();
      const category = categoryName ? await prisma.galleryCategory.upsert({ where: { slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }, create: { name: categoryName, slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }, update: { name: categoryName } }) : null;
      const mediaIds = data.media.map(file => file.id); const mediaRows = mediaIds.length ? await prisma.media.findMany({ where: { id: { in: mediaIds } }, select: { id: true, mimeType: true } }) : [];
      if (new Set(mediaIds).size !== mediaIds.length || mediaRows.length !== mediaIds.length) return NextResponse.json({ error: "One or more selected image files are unavailable or duplicated." }, { status: 400 });
      if (mediaRows.some(file => !file.mimeType.startsWith("image/"))) return NextResponse.json({ error: "Gallery items can contain images only." }, { status: 400 });
      const saved = await prisma.gallery.create({ data: { slug: data.slug, title: data.title, description: data.description, status: data.status, order: data.order, categoryId: category?.id || null, mediaIds } });
      await prisma.$transaction([prisma.galleryMedia.deleteMany({ where: { galleryId: saved.id } }), ...data.media.map((file, order) => prisma.galleryMedia.create({ data: { galleryId: saved.id, mediaId: file.id, order } })), ...data.media.map(file => prisma.media.update({ where: { id: file.id }, data: { altText: file.altText } }))]);
      return NextResponse.json(await prisma.gallery.findUnique({ where: { id: saved.id }, include: { category: true, media: { include: { media: true }, orderBy: { order: "asc" } } } }), { status: 201 });
    }
    if (resource === "office-gallery") {
      const data = officeGalleryInputSchema.parse(raw);
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
      const saved = await prisma.$transaction(async (tx) => {
        const record = await tx.officeGallery.create({
          data: {
            branch: data.branch,
            area: data.area,
            status: data.status,
            media: {
              create: data.media.map((file, order) => ({
                order,
                media: { connect: { id: file.id } },
              })),
            },
          },
        });
        for (const file of data.media) {
          await tx.media.update({
            where: { id: file.id },
            data: { altText: file.altText },
          });
        }
        return tx.officeGallery.findUnique({
          where: { id: record.id },
          include: { media: { include: { media: true }, orderBy: { order: "asc" } } },
        });
      });
      return NextResponse.json(saved, { status: 201 });
    }
    if (resource === "courses") {
      const data = courseInputSchema.parse(raw); const university = await prisma.university.findUnique({ where: { id: data.universityId }, select: { id: true } });
      if (!university) return NextResponse.json({ error: "Select an existing university." }, { status: 400 });
      return NextResponse.json(await prisma.universityCourse.create({ data: { name: data.name, degreeLevel: data.degreeLevel ?? "", duration: data.duration ?? "", annualFee: data.annualFee ?? "", currency: data.currency ?? "", intakes: data.intakes ?? [], eligibility: data.eligibility ?? "", description: data.description ?? "", status: data.status ?? "DRAFT", order: data.order ?? 0, university: { connect: { id: data.universityId } } } }), { status: 201 });
    }
    if (resource === "users") {
      const data = userCreateSchema.parse(raw); const email = data.email.toLowerCase();
      return NextResponse.json(await prisma.user.create({ data: { name: data.name, email, role: data.role, passwordHash: await hash(data.password, 12) }, select: { id: true, name: true, email: true, role: true, isActive: true } }), { status: 201 });
    }
    if (resource === "settings") {
      const data = z.object({ key: z.string().min(1).max(80), value: z.string().max(10000) }).parse(raw);
      return NextResponse.json(await prisma.siteSetting.upsert({ where: { key: data.key }, create: { key: data.key, value: data.value }, update: { value: data.value } }), { status: 201 });
    }
    return NextResponse.json({ error: "Unknown module." }, { status: 404 });
  } catch (error) { return fail(error, "CMS create"); }
}
