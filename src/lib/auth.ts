// src/lib/auth.ts — NextAuth فقط هو مصدر الحقيقة للمصادقة (JWT موقّع)
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { queryOne } from "@/lib/db";
import bcrypt from "bcryptjs";

// ⚠️ تحذير فقط أثناء البناء — لا نرمي خطأً عند الاستيراد حتى لا يتعطل
// "Collecting page data". NextAuth نفسه يفرض NEXTAUTH_SECRET عند التشغيل الفعلي.
if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  console.warn("⚠️ NEXTAUTH_SECRET غير مضبوط! أضفه في Vercel → Settings → Environment Variables.");
}

type AuthUserRow = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
};

export const authOptions: NextAuthOptions = {
  // ملاحظة: لا نستخدم PrismaAdapter لأن المصادقة credentials + JWT فقط،
  // والمحوّل يتطلب جداول Account/Session غير الموجودة في المخطط.
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // أسبوع واحد
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "تسجيل الدخول",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
        }

        const email = credentials.email.trim().toLowerCase();

        const user = await queryOne<AuthUserRow>(
          `SELECT "id", "name", "email", "password", "role" FROM "User" WHERE "email" = $1`,
          [email],
        );
        if (!user) {
          // رسالة موحدة لمنع معرفة هل البريد مسجل أم لا (User Enumeration)
          throw new Error("بيانات الدخول غير صحيحة");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("بيانات الدخول غير صحيحة");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
