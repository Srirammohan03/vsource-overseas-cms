// Vsource-frontend\src\app\api\public\[type]\route.next.ts
import { NextResponse } from "next/server";
import { publicData } from "@/lib/cms";

export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await context.params;
    if (!["destinations", "universities", "gallery"].includes(type)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data = await publicData(type, request);
    return data == null ? NextResponse.json({ error: "Not found" }, { status: 404 }) : NextResponse.json(data);
  } catch (error) {
    console.error("CMS public API error", error);
    return NextResponse.json({ error: "Content service unavailable" }, { status: 503 });
  }
}
