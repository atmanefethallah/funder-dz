"use client";

import {
  Wallet,
  Ticket,
  Loader2,
  User,
  ClipboardList,
  ScanLine,
  Star,
  ShieldCheck,
  Info,
  X,
  Edit3,
  Phone,
  LogOut,
  MapPin,
  CalendarClock,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { QRCodeCanvas } from "qrcode.react";
import { useToast } from "@/components/ui/Toast";
import { exportTicketToPng } from "@/lib/ticketExport";
import { buildTicketVerificationPath } from "@/lib/ticketToken";

export default function ProfilePage() {
  const router = useRouter();
  const { success, error: toastError, confirm: confirmDialog } = useToast();
  const [userData, setUserData] = useState<any>(null);

  // ⭐ حالة مودال التقييم
  const [reviewTarget, setReviewTarget] = useState<{
    placeId: string;
    placeName: string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [rechargeAmount, setRechargeAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  const [editLoading, setEditLoading] = useState(false);

  const [downloadingTicket, setDownloadingTicket] = useState<string | null>(
    null,
  );

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        setEditForm({ name: data.name, phone: data.phone || "" });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // 🗑️ دالة الحذف الفوري واليدوي للتذكرة مع التنبيه
  const handleDeleteTicket = async (bookingId: string) => {
    const ok = await confirmDialog({
      title: "حذف التذكرة نهائياً",
      message:
        "لا يمكن التراجع عن هذا الإجراء. إن كانت مدفوعة سيُسترد عربونك لمحفظتك.",
      confirmText: "حذف نهائي",
      danger: true,
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        success("تم الحذف", data.message);
        setUserData((prev: any) => ({
          ...prev,
          bookings: prev.bookings.filter((b: any) => b.id !== bookingId),
        }));
      } else {
        toastError("تعذر الحذف", data.message);
      }
    } catch (error) {
      toastError("خطأ في الاتصال", "حدث خطأ. يرجى المحاولة لاحقاً.");
    }
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (res.ok) {
        success("تم التحديث", data.message);
        setUserData({
          ...userData,
          name: data.user.name,
          phone: data.user.phone,
        });
        setShowEditProfile(false);
      } else {
        toastError("فشل التحديث", data.message);
      }
    } catch (error) {
      toastError("خطأ", "حدث خطأ أثناء التحديث.");
    } finally {
      setEditLoading(false);
    }
  };

  // فتح مودال التقييم
  const openReview = (placeId: string, placeName: string) => {
    setReviewTarget({ placeId, placeName });
    setReviewRating(0);
    setReviewComment("");
  };

  // إرسال التقييم من المودال
  const submitReview = async () => {
    if (!reviewTarget) return;
    if (reviewRating < 1 || reviewRating > 5) {
      toastError("تقييم ناقص", "يرجى تحديد عدد النجوم من 1 إلى 5.");
      return;
    }
    setReviewLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: reviewTarget.placeId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        success("شكراً لتقييمك! 🌟", data.message);
        setReviewTarget(null);
      } else {
        toastError("تعذر إرسال التقييم", data.message);
      }
    } catch (error) {
      toastError("خطأ في الاتصال", "حدث خطأ أثناء إرسال التقييم.");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const okRecharge = await confirmDialog({
      title: "تأكيد طلب الشحن",
      message: `المبلغ: ${rechargeAmount} د.ج — رقم العملية: ${transactionId}. سيراجع الطلبَ فريقُ الإدارة.`,
      confirmText: "إرسال الطلب",
    });
    if (!okRecharge) return;

    setRechargeLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("amount", rechargeAmount);
    formData.append("transactionId", transactionId);
    if (receipt) formData.append("receipt", receipt);

    try {
      const res = await fetch("/api/wallet/recharge", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("تم إرسال طلب الشحن بنجاح! ⏳");
        setRechargeAmount("");
        setTransactionId("");
        setReceipt(null);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setRechargeLoading(false);
    }
  };

  const downloadFullTicket = async (bookingId: string) => {
    const ticketElement = document.getElementById(`ticket-${bookingId}`);
    if (!ticketElement) return;

    setDownloadingTicket(bookingId);

    try {
      await exportTicketToPng(
        ticketElement,
        `Funder-VIP-Ticket-${bookingId.slice(-6).toUpperCase()}.png`,
      );
    } catch (error) {
      console.error("خطأ في توليد الصورة:", error);
      toastError(
        "فشل حفظ التذكرة",
        "حدث خطأ أثناء حفظ التذكرة. يرجى المحاولة لاحقاً.",
      );
    } finally {
      setDownloadingTicket(null);
    }
  };

  const handleLogout = async () => {
    const ok = await confirmDialog({
      title: "تسجيل الخروج",
      message: "هل أنت متأكد أنك تريد تسجيل الخروج؟",
      confirmText: "خروج",
      danger: true,
    });
    if (ok) {
      // تسجيل الخروج عبر NextAuth — يدمّر جلسة JWT الموقّعة
      await signOut({ callbackUrl: "/" });
    }
  };

  if (loading)
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  if (!userData)
    return (
      <div className="text-center mt-20 text-xl font-bold">
        يرجى تسجيل الدخول أولاً
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 relative">
      {/* ⭐ مودال التقييم */}
      {reviewTarget && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          dir="rtl"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setReviewTarget(null)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
              aria-label="إغلاق"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-black text-gray-900 mb-1">
              قيّم تجربتك
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {reviewTarget.placeName}
            </p>

            <div className="flex justify-center gap-2 mb-6" dir="ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="transition hover:scale-110 active:scale-95"
                  aria-label={`${star} نجوم`}
                >
                  <Star
                    size={36}
                    className={
                      star <= reviewRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }
                  />
                </button>
              ))}
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="اكتب تعليقاً عن المكان... (اختياري)"
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-sm mb-4"
            />

            <button
              onClick={submitReview}
              disabled={reviewLoading || reviewRating === 0}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {reviewLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Star size={18} />
              )}
              {reviewLoading ? "جاري الإرسال..." : "إرسال التقييم"}
            </button>
          </div>
        </div>
      )}

      {showEditProfile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowEditProfile(false)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Edit3 className="text-blue-600" /> تعديل بياناتي
            </h2>
            <form onSubmit={handleEditProfile} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  اسم الحساب الكامل
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  رقم الهاتف (اختياري)
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-3.5 text-gray-400">
                    <Phone size={18} />
                  </span>
                  <input
                    type="tel"
                    placeholder="مثال: 0550000000"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 p-3 pr-10 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-left"
                    dir="ltr"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={editLoading}
                className="mt-4 w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {editLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "حفظ التعديلات"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {showInfoModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-6 text-center border-b pb-4">
              كيفية شحن محفظتك 💳
            </h2>
            <div className="flex flex-col gap-6">
              <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl">
                <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                  🇩🇿 للسياح المحليين
                </h3>
                <div className="bg-white p-3 rounded-xl border border-gray-200 text-sm font-mono text-gray-800">
                  <p className="mb-1">
                    <span className="text-gray-500 select-none">
                      الاسم واللقب:
                    </span>{" "}
                    FUNDER PLATFORM
                  </p>
                  <p className="mb-1">
                    <span className="text-gray-500 select-none">
                      رقم الحساب (RIP):
                    </span>{" "}
                    <span className="font-bold text-blue-600">
                      007 99999 0025797281 12
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500 select-none">رقم CCP:</span>{" "}
                    <span className="font-bold text-blue-600">
                      0025797281 الكلي 07
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="mt-6 w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition"
            >
              فهمت، أغلق النافذة
            </button>
          </div>
        </div>
      )}

      {/* الترويسة */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -z-10"></div>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm border border-blue-200 shrink-0">
            <User size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {userData.name}
              </h1>
              <button
                onClick={() => setShowEditProfile(true)}
                className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-lg transition"
                title="تعديل الحساب"
              >
                <Edit3 size={16} />
              </button>
            </div>
            <div className="flex flex-col text-sm text-gray-500 mt-1 gap-1">
              <span>✉️ {userData.email}</span>
              {userData.phone && (
                <span dir="ltr" className="text-right">
                  📞 {userData.phone}
                </span>
              )}
              <span className="inline-flex items-center w-max mt-1 bg-gray-100 px-2 py-0.5 rounded-md font-bold text-xs text-gray-600">
                {userData.role === "PARTNER"
                  ? "شريك مروّج"
                  : userData.role === "ADMIN"
                    ? "مدير المنصة"
                    : "سائح"}
              </span>
              {/* 💎 شارة الباقة الحالية */}
              <Link
                href="/pricing"
                className={`inline-flex items-center gap-1 w-max mt-1 px-2 py-0.5 rounded-md font-bold text-xs transition hover:opacity-80 ${userData.isPaid ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}
              >
                {userData.isPaid
                  ? `👑 ${userData.planName}`
                  : "الباقة المجانية — ترقَّ ✨"}
              </Link>
            </div>
          </div>
        </div>

        {userData.role === "ADMIN" && (
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-gray-800 hover:scale-105 w-full md:w-auto"
          >
            <ShieldCheck size={20} className="text-red-500" /> الإدارة المركزية
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* العمود الجانبي (المحفظة وزر الخروج الموحد) */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between text-blue-600">
              <div className="flex items-center gap-2">
                <Wallet size={24} />
                <h2 className="text-xl font-bold">المحفظة</h2>
              </div>
            </div>

            <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white shadow-md">
              <p className="text-sm opacity-80 mb-1">الرصيد المتاح</p>
              <h3 className="text-4xl font-bold">
                {Number(userData.balance ?? 0).toLocaleString("en-DZ")}{" "}
                <span className="text-lg font-normal">د.ج</span>
              </h3>
            </div>

            {userData.role === "TOURIST" && (
              <form onSubmit={handleRecharge} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    طلب شحن رصيد
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowInfoModal(true)}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition"
                  >
                    <Info size={14} /> كيف أشحن؟
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="رقم العملية البنكية (مثال: TRX-123456)"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full rounded-lg border p-2 outline-none focus:border-blue-500 text-sm"
                  required
                />
                <input
                  type="number"
                  min="100"
                  placeholder="المبلغ (د.ج)"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="w-full rounded-lg border p-2 outline-none focus:border-blue-500"
                  required
                />
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-3 hover:bg-gray-100 transition">
                  <span className="text-xs text-gray-500 font-medium text-center">
                    {receipt ? receipt.name : "📎 إرفاق الوصل البنكي"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                    className="hidden"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={rechargeLoading}
                  className="rounded-lg bg-blue-600 p-2.5 text-white font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-md"
                >
                  {rechargeLoading ? (
                    <Loader2 className="animate-spin mx-auto" size={20} />
                  ) : (
                    "إرسال طلب الشحن"
                  )}
                </button>
                {message && (
                  <p className="text-sm font-medium mt-1 text-blue-600 text-center">
                    {message}
                  </p>
                )}
              </form>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 border border-red-100 p-4 font-bold text-red-600 transition hover:bg-red-100 hover:shadow-sm"
          >
            <LogOut size={20} /> تسجيل الخروج نهائياً
          </button>
        </div>

        {/* العمود الرئيسي (التذاكر وإدارة المعالم) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {userData.role === "PARTNER" && (
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 shadow-sm flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-blue-800 mb-2">
                  لوحة إدارة المعالم
                </h2>
                <p className="text-sm text-blue-600">
                  أدر طلبات الحجز الخاصة بك وتأكد من تذاكر الزوار عند البوابة.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/partner/bookings"
                  className="flex flex-1 justify-center items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 shadow-md"
                >
                  <ClipboardList size={20} /> إدارة طلبات الحجز
                </Link>
                <Link
                  href="/partner/scanner"
                  className="flex flex-1 justify-center items-center gap-2 whitespace-nowrap rounded-lg bg-white border-2 border-blue-600 px-6 py-3 font-bold text-blue-700 transition hover:bg-blue-50 shadow-md"
                >
                  <ScanLine size={20} /> ماسح التذاكر (QR)
                </Link>
              </div>
            </div>
          )}

          {/* 🛡️ التعديل هنا: إخفاء التذاكر إذا كان المستخدم شريكاً */}
          {userData.role !== "PARTNER" && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm min-h-full">
              <div className="mb-6 flex items-center gap-2 text-gray-800">
                <Ticket size={24} />
                <h2 className="text-xl font-bold">
                  حجوزاتي وتذاكري الإلكترونية
                </h2>
              </div>

              {!userData.bookings || userData.bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-gray-400">
                  <Ticket size={48} className="mb-4 opacity-50" />
                  <p>لم تقم بأي حجوزات شخصية حتى الآن.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {userData.bookings.map((booking: any) => (
                    <div
                      key={booking.id}
                      id={`ticket-${booking.id}`}
                      className="relative flex flex-col sm:flex-row w-full max-w-2xl mx-auto rounded-2xl shadow-sm border border-gray-200 bg-white overflow-hidden group"
                      dir="rtl"
                    >
                      {/* ❌ زر الحذف الفوري اليدوي */}
                      <button
                        onClick={() => handleDeleteTicket(booking.id)}
                        data-html2canvas-ignore="true" // لكي لا يظهر في الصورة
                        className="absolute top-3 left-3 p-1.5 bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-full transition z-20 shadow-sm"
                        title="حذف التذكرة"
                      >
                        <X size={16} />
                      </button>

                      {/* الجانب الأيمن (البيانات) */}
                      <div className="flex-1 p-6 relative bg-gradient-to-br from-gray-50 to-white">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                            Funder Smart Ticket
                          </span>
                          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md mr-10">
                            #{booking.id.slice(-6).toUpperCase()}
                          </span>
                        </div>

                        <h4 className="font-black text-2xl text-gray-900 mb-2 leading-tight pr-2">
                          {booking.place.name}
                        </h4>

                        <div className="flex items-center gap-4 text-xs font-bold text-gray-500 mb-5 pr-2">
                          <span className="flex items-center gap-1">
                            <CalendarClock
                              size={16}
                              className="text-blue-500"
                            />{" "}
                            {new Date(booking.createdAt).toLocaleDateString(
                              "ar-DZ",
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={16} className="text-blue-500" />{" "}
                            مستغانم
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl">
                          <span className="text-xs opacity-80">المدفوع:</span>
                          <span className="font-black text-base" dir="ltr">
                            {booking.amount} د.ج
                          </span>
                        </div>
                      </div>

                      {/* الفاصل المتقطع الدقيق */}
                      <div className="relative flex items-center sm:flex-col justify-center bg-white border-t sm:border-t-0 sm:border-r-2 border-dashed border-gray-300">
                        <div className="absolute -left-4 sm:-top-4 sm:left-1/2 sm:-translate-x-1/2 w-8 h-8 bg-gray-50 rounded-full border border-gray-200 z-10 hidden sm:block"></div>
                        <div className="absolute -right-4 sm:-bottom-4 sm:left-1/2 sm:-translate-x-1/2 w-8 h-8 bg-gray-50 rounded-full border border-gray-200 z-10 hidden sm:block"></div>
                      </div>

                      {/* الجانب الأيسر (الـ QR Code) */}
                      <div className="p-6 flex flex-col items-center justify-center bg-white min-w-[200px]">
                        {booking.status === "PENDING" && (
                          <div className="text-center">
                            <span className="inline-block rounded-full bg-amber-50 border border-amber-200 px-4 py-2 text-xs font-bold text-amber-700 animate-pulse mb-2">
                              ⏳ قيد المراجعة
                            </span>
                            <p className="text-[10px] text-gray-400">
                              بانتظار تأكيد الشريك
                            </p>
                          </div>
                        )}

                        {booking.status === "REJECTED" && (
                          <div className="text-center">
                            <span className="inline-block rounded-full bg-red-50 border border-red-200 px-4 py-2 text-xs font-bold text-red-700 mb-2">
                              ❌ تم الرفض
                            </span>
                            <p className="text-[10px] text-gray-400">
                              تمت إعادة المبلغ لمحفظتك
                            </p>
                          </div>
                        )}

                        {booking.status === "CONFIRMED" && (
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                              <QRCodeCanvas
                                value={buildTicketVerificationPath(
                                  booking.qrToken || booking.id,
                                )}
                                size={320}
                                level="H"
                                includeMargin={true}
                                style={{ width: 110, height: 110 }}
                              />
                            </div>

                            {downloadingTicket !== booking.id && (
                              <button
                                onClick={() => downloadFullTicket(booking.id)}
                                data-html2canvas-ignore="true"
                                className="text-blue-600 hover:text-blue-700 text-xs font-black underline underline-offset-4 transition mt-1"
                              >
                                حفظ التذكرة كصورة ⬇️
                              </button>
                            )}
                            {downloadingTicket === booking.id && (
                              <span
                                data-html2canvas-ignore="true"
                                className="text-blue-500 text-[10px] font-bold flex items-center gap-1 mt-1"
                              >
                                <Loader2 size={12} className="animate-spin" />{" "}
                                جاري الحفظ...
                              </span>
                            )}
                          </div>
                        )}

                        {booking.status === "USED" && (
                          <div className="flex flex-col gap-3 w-full text-center items-center">
                            <span className="rounded-full bg-gray-100 border border-gray-300 px-4 py-2 text-xs font-bold text-gray-500">
                              🎫 تذكرة مستهلكة
                            </span>
                            <button
                              onClick={() =>
                                openReview(
                                  booking.placeId,
                                  booking.place?.name || "المعلم",
                                )
                              }
                              data-html2canvas-ignore="true"
                              className="flex items-center justify-center gap-1 text-[11px] font-bold bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100 py-2 px-4 rounded-lg transition mt-1"
                            >
                              <Star size={14} className="fill-yellow-600" />{" "}
                              قيّم تجربتك
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
