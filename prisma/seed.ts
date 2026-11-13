import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding the super admin.");
  if (password.length < 12 || password.length > 128 || Buffer.byteLength(password, "utf8") > 72) throw new Error("ADMIN_PASSWORD must be 12 to 128 characters and at most 72 UTF-8 bytes.");
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (existing) {
    if (existing.role !== "SUPER_ADMIN") await prisma.user.update({ where: { id: existing.id }, data: { role: "SUPER_ADMIN" } });
    console.log(`Super admin ${email} already exists; password left unchanged.`);
    return;
  }
  const passwordHash = await hash(password, 12);
  await prisma.user.create({ data: { email, passwordHash, role: "SUPER_ADMIN", name: "Super Admin" } });
  console.log(`Created super admin ${email}.`);
}
main().catch(error => { console.error("Admin seed failed:", error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
