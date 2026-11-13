import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/authorization";

const schema = z.object({ universityId: z.string().min(1), key: z.string().min(1).max(80), title: z.string().min(1).max(200), content: z.record(z.string(), z.unknown()), order: z.number().int().default(0) });
export async function POST(request: Request) {
  const access = await requireApiRole(); if (access.response) return access.response;
  try {
    const data = schema.parse(await request.json());
    const university = await prisma.university.findUnique({ where: { id: data.universityId }, select: { id: true } });
    if (!university) return NextResponse.json({ error: "University not found." }, { status: 404 });
    const record = { universityId: data.universityId, key: data.key, title: data.title, content: data.content as Prisma.InputJsonValue, order: data.order };
    return NextResponse.json(await prisma.universityPageSection.upsert({ where: { universityId_key: { universityId: data.universityId, key: data.key } }, create: record, update: { title: data.title, content: record.content, order: data.order } }));
  } catch (error) { if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid university section.", details: error.flatten() }, { status: 400 }); console.error("University section save failed", error); return NextResponse.json({ error: "Unable to save section." }, { status: 500 }); }
}
export async function DELETE(request: Request) {
  const access = await requireApiRole("ADMIN"); if (access.response) return access.response;
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Section id is required." }, { status: 400 });
  await prisma.universityPageSection.delete({ where: { id: parsed.data.id } });
  return NextResponse.json({ success: true });
}
