import { NextResponse } from "next/server";
import { InquiryStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/permissions";
import { formatEnquiryDateTimeIST } from "@/lib/date-format";
import { enquiryListQuerySchema, enquiryStatuses, istDateRange } from "@/features/enquiries/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function filters(query: z.infer<typeof enquiryListQuerySchema>) {
  const range = istDateRange(query.from, query.to);
  const phoneDigits = query.search.replace(/\D/g, "");
  return {
    ...(query.search ? { OR: [
      { studentName: { contains: query.search, mode: "insensitive" as const } },
      ...(phoneDigits ? [{ phone: { contains: phoneDigits } }] : []),
    ] } : {}),
    ...(query.service ? { serviceRequired: query.service } : {}),
    ...(query.status ? { status: query.status as InquiryStatus } : {}),
    ...(Object.keys(range).length ? { createdAt: range } : {}),
  } satisfies Prisma.InquiryWhereInput;
}

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const access = await requireApiRole("EDITOR");
  if (access.response) return access.response;
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = enquiryListQuerySchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid enquiry filters." }, { status: 400 });
  const query = parsed.data;
  const where = filters(query);

  try {
    if (query.format === "csv") {
      const total = await prisma.inquiry.count({ where });
      if (total > 50000) return NextResponse.json({ error: "Narrow the filters before exporting more than 50,000 records." }, { status: 413 });
      const rows = await prisma.inquiry.findMany({ where, orderBy: { createdAt: "desc" }, take: 50000 });
      const header = ["S.NO", "ENQUIRY_ID", "STUDENT_NAME", "NUMBER", "CREATEDAT_UTC", "CREATEDAT_IST", "SERVICE_REQUIRED", "STATUS"];
      const lines = rows.map(row => [
        row.enquiryNumber,
        row.id,
        row.studentName,
        row.phone,
        row.createdAt.toISOString(),
        formatEnquiryDateTimeIST(row.createdAt),
        row.serviceRequired,
        row.status,
      ].map(csvCell).join(","));
      return new NextResponse(`\uFEFF${[header.map(csvCell).join(","), ...lines].join("\r\n")}`, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="vsource-enquiries.csv"',
          "Cache-Control": "no-store",
        },
      });
    }

    const skip = (query.page - 1) * query.pageSize;
    const [items, total, grouped, totalAll] = await Promise.all([
      prisma.inquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: query.pageSize, select: { id: true, enquiryNumber: true, studentName: true, phone: true, serviceRequired: true, status: true, createdAt: true, updatedAt: true } }),
      prisma.inquiry.count({ where }),
      prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.inquiry.count(),
    ]);
    const counts = Object.fromEntries(grouped.map(row => [row.status, row._count._all]));
    const summary = { total: totalAll, ...Object.fromEntries(enquiryStatuses.map(status => [status, counts[status] || 0])) };
    return NextResponse.json({ items, total, page: query.page, pageSize: query.pageSize, pageCount: Math.ceil(total / query.pageSize), summary }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin enquiry list failed", error);
    return NextResponse.json({ error: "Enquiries are temporarily unavailable. Please try again." }, { status: 503 });
  }
}
