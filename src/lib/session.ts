// src/lib/session.ts — نقطة التحقق الموحدة من الجلسة (تستبدل كوكي user_session اليدوي)
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type SessionUser = {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
};

/**
 * يجلب المستخدم من جلسة NextAuth (JWT موقّع ومشفّر).
 * لا تثق أبداً بأي كوكي يدوي أو معرف قادم من العميل.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const u = session?.user as { id?: string; role?: string; name?: string | null; email?: string | null } | undefined;
  if (!u?.id) return null;
  return { id: u.id, role: u.role ?? "TOURIST", name: u.name, email: u.email };
}

/**
 * يتطلب مستخدماً مسجلاً بدور محدد. يعيد null إن لم يتحقق الشرط.
 * الاستخدام داخل API Routes:
 *   const admin = await requireRole("ADMIN");
 *   if (!admin) return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
 */
export async function requireRole(...roles: string[]): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}
