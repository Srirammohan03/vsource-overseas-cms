import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/permissions";
import { enquiryStatusSchema } from "@/features/enquiries/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireApiRole("EDITOR");
  if (access.response) return access.response;
  const { id } = await context.params;
  try {
    const enquiry = await prisma.inquiry.findUnique({ where: { id }, select: { id: true, enquiryNumber: true, studentName: true, phone: true, serviceRequired: true, status: true, createdAt: true, updatedAt: true } });
    return enquiry ? NextResponse.json(enquiry, { headers: { "Cache-Control": "no-store" } }) : NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
  } catch (error) {
    console.error("Admin enquiry detail failed", error);
    return NextResponse.json({ error: "Enquiry details are temporarily unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireApiRole("EDITOR");
  if (access.response) return access.response;
  const { id } = await context.params;
  let raw: unknown;
  try { raw = await request.json(); }
  catch { return NextResponse.json({ error: "Provide a valid enquiry status." }, { status: 400 }); }
  const parsed = enquiryStatusSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Select a valid enquiry status." }, { status: 400 });
  try {
    const enquiry = await prisma.inquiry.update({ where: { id }, data: { status: parsed.data.status }, select: { id: true, enquiryNumber: true, studentName: true, phone: true, serviceRequired: true, status: true, createdAt: true, updatedAt: true } });
    return NextResponse.json(enquiry, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    console.error("Admin enquiry status update failed", error);
    return NextResponse.json({ error: "Enquiry status could not be updated." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireApiRole("ADMIN");
  if (access.response) return access.response;
  const { id } = await context.params;
  try {
    await prisma.inquiry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    console.error("Admin enquiry delete failed", error);
    return NextResponse.json({ error: "Enquiry could not be deleted." }, { status: 503 });
  }
}
