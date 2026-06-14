"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TranscriptionDTO } from "@/lib/api-types";
import { StatusBadge } from "./StatusBadge";
import { formatDate, msToClock } from "@/lib/format";
import { buildTxt, buildSrt, downloadFile } from "@/lib/export";

const SPEAKER_COLORS = [
  "bg-indigo-50 border-indigo-200",
  "bg-emerald-50 border-emerald-200",
  "bg-amber-50 border-amber-200",
  "bg-rose-50 border-rose-200",
  "bg-sky-50 border-sky-200",
  "bg-violet-50 border-violet-200",
];

function speakerColor(speaker: string): string {
  const code = speaker.charCodeAt(0);
  return SPEAKER_COLORS[code % SPEAKER_COLORS.length];
}

export function TranscriptionDetail({ id }: { id: string }) {
  const [record, setRecord] = useState<TranscriptionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/transcriptions/${id}`, {
        cache: "no-store",
      });
      if (res.status === 404) throw new Error("התמלול לא נמצא");
      if (!res.ok) throw new Error("טעינה נכשלה");
      const data = (await res.json()) as { record: TranscriptionDTO };
      setRecord(data.record);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // polling כל עוד התמלול עדיין בעבודה
  useEffect(() => {
    if (!record) return;
    if (record.status !== "queued" && record.status !== "processing") return;
    timerRef.current = setTimeout(load, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [record, load]);

  async function handleRetry() {
    setRetrying(true);
    try {
      await fetch(`/api/transcriptions/${id}/retry`, { method: "POST" });
      await load();
    } finally {
      setRetrying(false);
    }
  }

  async function handleSummarize() {
    setSummarizing(true);
    setSummaryError(null);
    try {
      const res = await fetch(`/api/transcriptions/${id}/summary`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "יצירת הסיכום נכשלה");
      }
      const data = (await res.json()) as { record: TranscriptionDTO };
      setRecord(data.record);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : "יצירת הסיכום נכשלה");
    } finally {
      setSummarizing(false);
    }
  }

  const filteredSpeakers = useMemo(() => {
    if (!record?.speakers) return null;
    if (!query.trim()) return record.speakers;
    const q = query.trim();
    return record.speakers.filter((s) => s.text.includes(q));
  }, [record, query]);

  if (loading) {
    return <p className="text-slate-400">טוען...</p>;
  }

  if (error || !record) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-700">
        {error ?? "לא נמצא"}
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/"
        className="mb-4 inline-block text-sm text-brand hover:text-brand-dark"
      >
        ← חזרה לרשימה
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {record.fileName}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {formatDate(record.createdAt)}
          </p>
        </div>
        <StatusBadge status={record.status} />
      </div>

      {/* מצב לא-הושלם */}
      {record.status === "processing" && (
        <p className="rounded-xl bg-amber-50 p-6 text-amber-800">
          התמלול בעבודה... העמוד יתעדכן אוטומטית עם סיום.
        </p>
      )}
      {record.status === "queued" && (
        <p className="rounded-xl bg-slate-100 p-6 text-slate-600">
          ממתין בתור...
        </p>
      )}
      {record.status === "error" && (
        <div className="rounded-xl bg-red-50 p-6 text-red-700">
          <p className="mb-3 font-medium">התמלול נכשל</p>
          {record.error && (
            <p className="mb-4 text-sm opacity-80">{record.error}</p>
          )}
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {retrying ? "מנסה שוב..." : "נסה שוב"}
          </button>
        </div>
      )}

      {/* מצב הושלם */}
      {record.status === "completed" && (
        <div>
          {/* סיכום הפגישה */}
          <div className="mb-6 rounded-xl border border-brand-border bg-brand-light p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-brand">
                <span>📝</span> סיכום הפגישה
              </h2>
              {record.summary ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      downloadFile(
                        `${record.fileName} - סיכום.txt`,
                        record.summary ?? "",
                      )
                    }
                    className="rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-light"
                  >
                    הורד
                  </button>
                  <button
                    onClick={handleSummarize}
                    disabled={summarizing}
                    className="rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-light disabled:opacity-60"
                  >
                    {summarizing ? "מסכם..." : "רענן"}
                  </button>
                </div>
              ) : null}
            </div>

            {record.summary ? (
              <div className="leading-relaxed whitespace-pre-wrap text-slate-800">
                {record.summary}
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-slate-600">
                  צרו סיכום אוטומטי של הפגישה — נושאים עיקריים, החלטות ומשימות.
                </p>
                <button
                  onClick={handleSummarize}
                  disabled={summarizing}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  {summarizing ? "מסכם... (עד דקה)" : "✨ צור סיכום"}
                </button>
              </div>
            )}

            {summaryError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {summaryError}
              </p>
            )}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש בתמלול..."
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-brand-border"
            />
            <button
              onClick={() =>
                downloadFile(
                  `${record.fileName}.txt`,
                  buildTxt(record.text, record.speakers),
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              הורד TXT
            </button>
            {record.speakers && record.speakers.length > 0 && (
              <button
                onClick={() =>
                  downloadFile(
                    `${record.fileName}.srt`,
                    buildSrt(record.speakers),
                    "application/x-subrip",
                  )
                }
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                הורד SRT
              </button>
            )}
          </div>

          {/* תצוגה לפי דוברים אם קיימת, אחרת טקסט רציף */}
          {filteredSpeakers && filteredSpeakers.length > 0 ? (
            <div className="flex flex-col gap-3">
              {filteredSpeakers.map((s, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${speakerColor(s.speaker)}`}
                >
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>דובר {s.speaker}</span>
                    <span>{msToClock(s.start)}</span>
                  </div>
                  <p className="leading-relaxed text-slate-800">{s.text}</p>
                </div>
              ))}
            </div>
          ) : record.speakers && filteredSpeakers?.length === 0 ? (
            <p className="text-slate-400">אין תוצאות לחיפוש.</p>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-5 leading-relaxed whitespace-pre-wrap text-slate-800">
              {record.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
