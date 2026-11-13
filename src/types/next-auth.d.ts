import "next-auth";
import "next-auth/jwt";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User { role: UserRole }
  interface Session { user: { id: string; role: UserRole } & NonNullable<Session["user"]> }
}

declare module "next-auth/jwt" {
  interface JWT { role?: UserRole }
}
