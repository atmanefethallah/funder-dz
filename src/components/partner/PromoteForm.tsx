"use client";
import { useEffect, useState } from "react";
import { Loader2, Megaphone } from "lucide-react";
export default function PromoteForm() {
  const [data, setData] = useState<any>(null);
  const [placeId, setPlaceId] = useState("");
  const [packageKey, setPackageKey] = useState("");
  const [startAt, setStartAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const load = () =>
    fetch("/api/partner/promotions", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setPlaceId(d.places?.[0]?.id || "");
        setPackageKey(d.packages?.[0]?.key || "");
      });
  useEffect(() => {
    load();
  }, []);
  const submit = async () => {
    setLoading(true);
    setMsg("");
    const r = await fetch("/api/partner/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, packageKey, startAt }),
    });
    const d = await r.json();
    setMsg(d.message);
    setLoading(false);
    if (r.ok) load();
  };
  if (!data) return <Loader2 className="mx-auto animate-spin" />;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8" dir="rtl">
      <div className="rounded-3xl bg-gradient-to-l from-amber-500 to-orange-600 p-6 text-white">
        <h1 className="flex gap-2 text-2xl font-black">
          <Megaphone />
          Funder Promote
        </h1>
        <p>
          روّج لعناصر تملكها فقط. السعر يُحسب في الخادم وتُحجز الميزانية من
          المحفظة.
        </p>
      </div>
      <section className="mt-6 grid gap-3 rounded-3xl border bg-white p-5 md:grid-cols-3">
        <select
          className="rounded-xl border p-3"
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
        >
          {data.places.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border p-3"
          value={packageKey}
          onChange={(e) => setPackageKey(e.target.value)}
        >
          {data.packages.map((p: any) => (
            <option key={p.key} value={p.key}>
              {p.name} — {p.durationDays} أيام
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          className="rounded-xl border p-3"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
        />
        <button
          onClick={submit}
          disabled={loading || !placeId || !startAt}
          className="rounded-xl bg-amber-500 p-3 font-black text-white disabled:opacity-40 md:col-span-3"
        >
          {loading ? "جاري حجز الميزانية..." : "إنشاء الحملة"}
        </button>
        {msg && <p className="font-bold text-gray-700 md:col-span-3">{msg}</p>}
      </section>
      <section className="mt-6 overflow-hidden rounded-3xl border bg-white">
        <h2 className="p-4 font-black">حملاتي</h2>
        {data.campaigns.length ? (
          data.campaigns.map((c: any) => (
            <div
              key={c.id}
              className="flex justify-between border-t p-4 text-sm"
            >
              <span>{c.placeName}</span>
              <span className="font-bold">
                {c.status} — {Number(c.budget).toLocaleString()} دج
              </span>
            </div>
          ))
        ) : (
          <p className="border-t p-6 text-gray-500">لا توجد حملات بعد.</p>
        )}
      </section>
    </main>
  );
}
