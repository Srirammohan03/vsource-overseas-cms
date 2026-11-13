import { NextResponse } from "next/server";
import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/authorization";

export async function POST(request: Request) {
  const access = await requireApiRole(); if (access.response) return access.response;
  const parsed = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(12).max(128).refine(value => Buffer.byteLength(value, "utf8") <= 72, "New password must be at most 72 UTF-8 bytes.") }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "New password must be at least 12 characters." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: access.user!.id }, select: { passwordHash: true } });
  if (!user || !(await compare(parsed.data.currentPassword, user.passwordHash))) return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  await prisma.user.update({ where: { id: access.user!.id }, data: { passwordHash: await hash(parsed.data.newPassword, 12) } });
  return NextResponse.json({ success: true });
}
