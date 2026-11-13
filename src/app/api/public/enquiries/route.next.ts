import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publicEnquirySchema } from "@/features/enquiries/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RateWindow = { startedAt: number; count: number };
const globalForEnquiryRate = globalThis as typeof globalThis & { enquiryRateWindows?: Map<string, RateWindow> };
const rateWindows = globalForEnquiryRate.enquiryRateWindows ?? new Map<string, RateWindow>();
globalForEnquiryRate.enquiryRateWindows = rateWindows;

function requestIp(request: Request) {
  return request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

function allowRequest(ip: string, now = Date.now()) {
  const windowMs = 10 * 60 * 1000;
  const existing = rateWindows.get(ip);
  if (!existing || now - existing.startedAt >= windowMs) {
    rateWindows.set(ip, { startedAt: now, count: 1 });
  } else if (existing.count >= 5) {
    return Math.max(1, Math.ceil((windowMs - (now - existing.startedAt)) / 1000));
  } else {
    existing.count += 1;
  }
  if (rateWindows.size > 5000) {
    for (const [key, value] of rateWindows) if (now - value.startedAt >= windowMs) rateWindows.delete(key);
  }
  return 0;
}

const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  let submissionKeyForRetry: string | undefined;
  try {
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > 8192) return json({ error: "The enquiry form is too large." }, 413);

    let raw: unknown;
    try { raw = await request.json(); }
    catch { return json({ error: "Please submit a valid enquiry form." }, 400); }

    const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
    const cleanName = typeof source.studentName === "string"
      ? source.studentName.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim()
      : source.studentName;
    const parsed = publicEnquirySchema.safeParse({ ...source, studentName: cleanName });
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return json({ error: firstIssue?.message || "Please check the enquiry fields." }, 400);
    }

    const data = parsed.data;
    submissionKeyForRetry = data.submissionKey;
    if (data.submissionKey) {
      const prior = await prisma.inquiry.findUnique({ where: { submissionKey: data.submissionKey }, select: { id: true, enquiryNumber: true } });
      if (prior) return json({ success: true, enquiryNumber: prior.enquiryNumber }, 200);
    }

    const retryAfter = allowRequest(requestIp(request));
    if (retryAfter) return json({ error: "Too many enquiries from this connection. Please try again shortly." }, 429);

    const result = await prisma.$transaction(async tx => {
      // Cast PostgreSQL's `void` lock return to text so Prisma can deserialize it.
      await tx.$queryRaw<Array<{ lock_result: string }>>`SELECT pg_advisory_xact_lock(hashtext(${data.phone}))::text AS lock_result`;

      if (data.submissionKey) {
        const prior = await tx.inquiry.findUnique({ where: { submissionKey: data.submissionKey }, select: { id: true, enquiryNumber: true } });
        if (prior) return { kind: "existing" as const, inquiry: prior };
      }

      const recent = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Inquiry"
        WHERE "phone" = ${data.phone}
          AND "createdAt" >= CURRENT_TIMESTAMP - INTERVAL '30 seconds'
        LIMIT 1
      `;
      if (recent.length) return { kind: "rate-limited" as const };

      const inquiry = await tx.inquiry.create({
        data: {
          studentName: data.studentName,
          phone: data.phone,
          serviceRequired: data.serviceRequired,
          ...(data.submissionKey ? { submissionKey: data.submissionKey } : {}),
        },
        select: { id: true, enquiryNumber: true },
      });
      return { kind: "created" as const, inquiry };
    });

    if (result.kind === "rate-limited") return json({ error: "An enquiry was recently received for this mobile number. Please wait a moment before trying again." }, 429);
    return json({ success: true, enquiryNumber: result.inquiry.enquiryNumber }, result.kind === "created" ? 201 : 200);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      if (submissionKeyForRetry) {
        try {
          const prior = await prisma.inquiry.findUnique({ where: { submissionKey: submissionKeyForRetry }, select: { enquiryNumber: true } });
          if (prior) return json({ success: true, enquiryNumber: prior.enquiryNumber }, 200);
        } catch { /* Return the generic server response below. */ }
      }
    }
    console.error("Public enquiry save failed", error);
    return json({ error: "We could not save your enquiry right now. Please try again." }, 503);
  }
}
