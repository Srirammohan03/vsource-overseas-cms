import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { UserRole } from "@prisma/client";

const rank: Record<UserRole, number> = { EDITOR: 1, ADMIN: 2, SUPER_ADMIN: 3 };
export async function requirePageRole(minimum: UserRole = "EDITOR") {
  const session = await auth();
  if (!session?.user?.id || rank[session.user.role] < rank[minimum]) redirect("/admin/login");
  return session.user;
}
export async function requireApiRole(minimum: UserRole = "EDITOR") {
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error("Admin authentication lookup failed", error);
    return { user: null, response: NextResponse.json({ error: "Authentication service is temporarily unavailable. Please try again." }, { status: 503 }) };
  }
  if (!session?.user?.id || rank[session.user.role] < rank[minimum]) return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { user: session.user, response: null };
}
