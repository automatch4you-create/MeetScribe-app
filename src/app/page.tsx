"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SourcePicker } from "@/components/SourcePicker";
import { TranscriptionList } from "@/components/TranscriptionList";
import type { TranscriptionDTO } from "@/lib/api-types";

export default function Home() {
  const router = useRouter();
  const [items, setItems] = useState<TranscriptionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/transcriptions", { cache: "no-store" });
      if (!res.ok) throw new Error("טעינת הרשימה נכשלה");
      const data = (await res.json()) as { items: TranscriptionDTO[] };
      setItems(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }, []);

  // טעינה ראשונית + polling כל עוד יש תמלולים פעילים
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const hasActive = items.some(
      (i) => i.status === "queued" || i.status === "processing",
    );
    if (!hasActive) return;
    timerRef.current = setTimeout(load, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [items, load]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="mb-2 flex justify-start">
        <button
          onClick={logout}
          className="text-xs text-slate-400 transition hover:text-slate-700"
        >
          התנתקות
        </button>
      </div>

      <header className="mb-8 flex flex-col items-center text-center">
        <Image
          src="/meetscribe-wide.png"
          alt="MeetScribe"
          width={2048}
          height={300}
          priority
          className="h-16 w-auto"
        />
        <p className="mt-2 text-lg font-medium text-[#1c4e6b]">
          תתרכזו בפגישה, אנחנו נדאג לסיכום.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          תמלול אוטומטי בעברית עם זיהוי דוברים
        </p>
      </header>

      <div className="mb-10">
        <SourcePicker onAdded={load} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            התמלולים שלי
          </h2>
          <button
            onClick={load}
            className="text-sm text-brand hover:text-brand-dark"
          >
            רענון
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-slate-400">טוען...</p>
        ) : (
          <TranscriptionList items={items} onDeleted={load} />
        )}
      </section>
    </main>
  );
}
