import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/authorization";
import { statusSchema } from "@/lib/cms";

const schema = z.object({ id: z.string().optional(), pageId: z.string().min(1), key: z.string().min(1).max(80), title: z.string().min(1).max(200), content: z.record(z.string(), z.unknown()), order: z.number().int().default(0), status: statusSchema.default("DRAFT") });
export async function POST(request: Request) {
  const access = await requireApiRole(); if (access.response) return access.response;
  try { const data = schema.parse(await request.json()); const record = { pageId: data.pageId, key: data.key, title: data.title, content: data.content as Prisma.InputJsonValue, order: data.order, status: data.status }; return NextResponse.json(await prisma.destinationSection.upsert({ where: { pageId_key: { pageId: data.pageId, key: data.key } }, create: record, update: { title: data.title, content: record.content, order: data.order, status: data.status } })); }
  catch (error) { if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid section.", details: error.flatten() }, { status: 400 }); return NextResponse.json({ error: "Unable to save section." }, { status: 500 }); }
}
export async function DELETE(request: Request) {
  const access = await requireApiRole("ADMIN"); if (access.response) return access.response;
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Section id is required." }, { status: 400 });
  await prisma.destinationSection.delete({ where: { id: parsed.data.id } }); return NextResponse.json({ success: true });
}
