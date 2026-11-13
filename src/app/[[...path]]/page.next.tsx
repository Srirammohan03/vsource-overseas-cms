import AppClient from "../providers";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/media-url";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ path?: string[] }> }): Promise<Metadata> {
  const { path = [] } = await params;
  let page: { title: string; seo: { title: string | null; description: string | null; keywords: string[]; canonicalUrl: string | null; ogImage: string | null } | null } | null = null;
  if (path[0]?.startsWith("study-in-")) page = await prisma.destinationPage.findFirst({ where: { slug: path[0], status: "PUBLISHED" }, select: { title: true, seo: { select: { title: true, description: true, keywords: true, canonicalUrl: true, ogImage: true } } } });
  if (path[0] === "explore-universities" && path[2]) {
    const university = await prisma.university.findFirst({
      where: { slug: path[2], status: "PUBLISHED" },
      select: { name: true, seo: { select: { title: true, description: true, keywords: true, canonicalUrl: true, ogImage: true } } },
    });
    page = university ? { title: university.name, seo: university.seo } : null;
  }
  if (!page) return {};
  const seo = page.seo;
  const title = seo?.title || page.title;
  const description = seo?.description || undefined;
  const image = seo?.ogImage ? mediaUrl(seo.ogImage) : undefined;
  return { title, description, keywords: seo?.keywords, alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined, openGraph: { title, description, images: image ? [image] : undefined } };
}
export default async function PublicAppRoute({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  return <AppClient initialPath={`/${path.join("/")}`} />;
}
