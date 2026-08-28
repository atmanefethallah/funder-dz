"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function ProtectedLink({
  href,
  children,
  className,
  isLoggedIn,
  message,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  isLoggedIn: boolean;
  message: string;
}) {
  const router = useRouter();
  const { info } = useToast();

  const handleClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault(); // يمنع الانتقال للصفحة
      info("تسجيل الدخول مطلوب", message); // تنبيه أنيق بدل alert
      router.push("/login"); // يوجهه لصفحة تسجيل الدخول
    }
  };

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
