// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

// تصدير دوال GET و POST للتعامل مع الطلبات
export { handler as GET, handler as POST };
