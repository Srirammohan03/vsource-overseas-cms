import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128).refine(value => Buffer.byteLength(value, "utf8") <= 72) });
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  cookies: { sessionToken: { name: process.env.NODE_ENV === "production" ? "__Host-vsource.session-token" : "vsource.session-token", options: { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" } } },
  providers: [Credentials({ credentials: { email: { type: "email" }, password: { type: "password" } }, async authorize(input) {
    const parsed = credentialsSchema.safeParse(input);
    if (!parsed.success) return null;
    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, passwordHash: true, role: true, isActive: true } });
    if (!user?.isActive || !(await compare(parsed.data.password, user.passwordHash))) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  } })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.sub = user.id; token.role = user.role; }
      else if (token.sub) {
        const current = await prisma.user.findUnique({ where: { id: token.sub }, select: { role: true, isActive: true } });
        if (current?.isActive) token.role = current.role;
        else { token.sub = ""; token.role = undefined; }
      }
      return token;
    },
    session({ session, token }) { if (session.user) { session.user.id = token.sub || ""; session.user.role = token.role || "EDITOR"; } return session; },
  },
  pages: { signIn: "/admin/login" },
});
