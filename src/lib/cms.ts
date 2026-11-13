import { z } from "zod";
import { prisma } from "./prisma";

export const statusSchema = z.enum(["DRAFT", "PUBLISHED"]);
export const upsertDestinationSchema = z.object({ country: z.string().min(2), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), title: z.string().min(1), content: z.record(z.string(), z.unknown()), status: statusSchema.default("DRAFT") });
export const upsertUniversitySchema = z.object({ country: z.string().min(2), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), name: z.string().min(1), campus: z.string().default(""), website: z.string().default(""), logo: z.unknown().optional(), banner: z.unknown().optional(), content: z.record(z.string(), z.unknown()), status: statusSchema.default("DRAFT") });
export const upsertGallerySchema = z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), title: z.string().min(1), description: z.string().default(""), category: z.string().optional(), mediaIds: z.array(z.string()).default([]), status: statusSchema.default("DRAFT"), order: z.number().int().default(0) });

const legacyCountryFlagCodes: Record<string, string> = {
  UK: "gb",
  USA: "us",
  CANADA: "ca",
  IRELAND: "ie",
  FRANCE: "fr",
};

function countryFlagUrl(code: string): string | null {
  const normalized = code.trim().toUpperCase();
  const isoCode = legacyCountryFlagCodes[normalized]
    || (/^[A-Z]{2}$/.test(normalized) ? normalized.toLowerCase() : null);
  return isoCode ? `https://flagcdn.com/w40/${isoCode}.png` : null;
}

export async function publicData(type: string, request: Request) {
  const url = new URL(request.url);
  if (type === "destinations") {
    if (url.searchParams.get("dropdown") === "true") {
      const pages = await prisma.destinationPage.findMany({
        where: { status: "PUBLISHED" },
        select: {
          slug: true,
          title: true,
          country: { select: { id: true, name: true, code: true } },
        },
        orderBy: { country: { name: "asc" } },
      });

      return pages
        .filter(page => /^study-in-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug)
          && Boolean(page.title.trim())
          && Boolean(page.country.name.trim())
          && Boolean(page.country.code.trim()))
        .map(page => ({
          id: page.country.id,
          name: page.country.name,
          code: page.country.code,
          flag: countryFlagUrl(page.country.code),
          countrySlug: page.slug.slice("study-in-".length),
          destinationTitle: page.title,
          destinationSlug: page.slug,
        }));
    }

    const slug = url.searchParams.get("slug");
    const pages = slug ? await prisma.destinationPage.findMany({ where: { slug, status: "PUBLISHED" }, include: { sections: { where: { status: "PUBLISHED" }, orderBy: { order: "asc" } }, country: true, seo: true } }) : await prisma.destinationPage.findMany({ where: { status: "PUBLISHED" }, include: { sections: { where: { status: "PUBLISHED" }, orderBy: { order: "asc" } }, country: true, seo: true }, orderBy: { country: { name: "asc" } } });
    const mapped = pages.map(page => ({ ...page, content: Object.assign({}, page.content && typeof page.content === "object" && !Array.isArray(page.content) ? page.content : {}, ...page.sections.map(section => ({ [section.key]: section.content }))) }));
    return slug ? mapped[0] ?? null : mapped;
  }
  if (type === "universities") {
    const slug = url.searchParams.get("slug"); const country = url.searchParams.get("country");
    if (slug) {
      const university = await prisma.university.findFirst({ where: { slug, status: "PUBLISHED" }, include: { country: true, courses: { where: { status: "PUBLISHED" }, orderBy: { order: "asc" } }, gallery: { include: { media: true }, orderBy: { order: "asc" } }, sections: { orderBy: { order: "asc" } }, seo: true } });
      if (!university) return null;
      const content = Object.assign({}, university.content && typeof university.content === "object" && !Array.isArray(university.content) ? university.content : {}, ...university.sections.map(section => ({ [section.key]: section.content })));
      return { ...university, content, gallerys: university.gallery.map(image => ({ id: image.id, url: image.media?.url || image.url, alternativeText: image.altText, name: image.media?.name || image.altText })) };
    }
    const page = Math.max(1, Number(url.searchParams.get("page") || 1)); const pageSize = 12;
    const where = { status: "PUBLISHED" as const, ...(country && country !== "All" ? { country: { name: { equals: country, mode: "insensitive" as const } } } : {}) };
    const [universities, total] = await Promise.all([prisma.university.findMany({ where, include: { country: true }, orderBy: { name: "asc" }, skip: (page - 1) * pageSize, take: pageSize }), prisma.university.count({ where })]);
    return { universities, pagination: { page, pageSize, pageCount: Math.ceil(total / pageSize), total } };
  }
  if (type === "gallery") {
    const requestedCategory = url.searchParams.get("category");
    const categoryFilter = requestedCategory === "students" ? { in: ["students", "student-success"] } : requestedCategory;
    const items = await prisma.gallery.findMany({ where: { status: "PUBLISHED", ...(requestedCategory ? { category: { slug: categoryFilter! } } : {}) }, include: { category: true, media: { include: { media: true }, orderBy: { order: "asc" } } }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
    const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    return items.map(item => ({
      ...item,
      videoUrl: null,
      media: item.media.filter(({ media }) => Boolean(media?.url) && supportedImageTypes.has(media?.mimeType.toLowerCase() || "")),
    }));
  }
  return null;
}
