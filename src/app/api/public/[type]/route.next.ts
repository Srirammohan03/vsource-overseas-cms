// Vsource-frontend\src\app\api\public\[type]\route.next.ts
import { NextResponse } from "next/server";
import { publicData } from "@/lib/cms";
import { officeAreaValues, officeBranchValues } from "@/features/cms/types/office-gallery";

export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await context.params;
    if (!["destinations", "universities", "gallery", "office-gallery"].includes(type)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (type === "office-gallery") {
      const query = new URL(request.url).searchParams;
      const branch = query.get("branch");
      const area = query.get("area");
      if (
        (branch && !officeBranchValues.some((value) => value.toLowerCase() === branch.toLowerCase())) ||
        (area && !officeAreaValues.some((value) => value.toLowerCase() === area.toLowerCase()))
      ) {
        return NextResponse.json({ error: "Invalid office branch or area." }, { status: 400 });
      }
    }
    const data = await publicData(type, request);
    return data == null ? NextResponse.json({ error: "Not found" }, { status: 404 }) : NextResponse.json(data);
  } catch (error) {
    console.error("CMS public API error", error);
    return NextResponse.json({ error: "Content service unavailable" }, { status: 503 });
  }
}
