import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/permissions";

const schema = z.object({ media: z.array(z.object({ id: z.string().min(1), altText: z.string().max(500).default("") })).max(100) });
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireApiRole("EDITOR"); if (access.response) return access.response;
  try {
    const { id } = await context.params; const data = schema.parse(await request.json());
    if (new Set(data.media.map(x => x.id)).size !== data.media.length) return NextResponse.json({ error: "A campus image was selected more than once." }, { status: 400 });
    const university = await prisma.university.findUnique({ where: { id }, select: { id: true } });
    if (!university) return NextResponse.json({ error: "University not found." }, { status: 404 });
    const media = await prisma.media.findMany({ where: { id: { in: data.media.map(x => x.id) }, mimeType: { startsWith: "image/" } }, select: { id: true, url: true } });
    if (media.length !== data.media.length) return NextResponse.json({ error: "One or more campus images are unavailable." }, { status: 400 });
    await prisma.$transaction(async tx => {
      await tx.universityGallery.deleteMany({ where: { universityId: id } });
      for (const [order, image] of data.media.entries()) {
        const record = media.find(x => x.id === image.id)!;
        await tx.universityGallery.create({ data: { universityId: id, mediaId: record.id, url: record.url, altText: image.altText, order } });
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid gallery data.", details: error.flatten() }, { status: 400 });
    console.error("University gallery update failed", error); return NextResponse.json({ error: "Campus gallery could not be saved." }, { status: 500 });
  }
}
