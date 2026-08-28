// src/middleware.ts — حارس المسارات على الحدود (قبل وصول الطلب للصفحة)
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;

      // غير مسجل: ممنوع من كل المسارات المحمية
      if (!token) return false;

      // مسارات الإدارة: للمدير فقط
      if (path.startsWith("/admin")) return token.role === "ADMIN";

      // مسارات الشريك: للشريك أو المدير
      if (
        path.startsWith("/partner") ||
        path.startsWith("/partner-dashboard") ||
        path.startsWith("/add-place") ||
        path.startsWith("/edit-place")
      ) {
        return token.role === "PARTNER" || token.role === "ADMIN";
      }

      // بقية المسارات المحمية: يكفي تسجيل الدخول
      return true;
    },
  },
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/partner/:path*",
    "/partner-dashboard/:path*",
    "/add-place",
    "/edit-place/:path*",
    "/wallet",
    "/profile",
    "/tickets/:path*",
    "/wishlist",
    "/smart-plan",
  ],
};
