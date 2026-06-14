"use client";

import Link from "next/link";
import { useState } from "react";
import type { TranscriptionDTO } from "@/lib/api-types";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "@/lib/format";

export function TranscriptionList({
  items,
  onDeleted,
}: {
  items: TranscriptionDTO[];
  onDeleted: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, fileName: string) {
    if (!confirm(`למחוק את "${fileName}"? פעולה זו אינה הפיכה.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/transcriptions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("המחיקה נכשלה");
      onDeleted();
    } catch {
      alert("המחיקה נכשלה, נסו שוב.");
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-white p-8 text-center text-slate-500">
        עדיין אין תמלולים. העלו הקלטה כדי להתחיל.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 transition hover:border-brand-border hover:shadow-sm"
        >
          <Link
            href={`/transcriptions/${item.id}`}
            className="flex min-w-0 flex-1 items-center justify-between gap-4 rounded-lg p-2"
          >
            <div className="min-w-0">
              <div className="truncate font-medium text-slate-800">
                {item.fileName}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {item.source === "drive" ? "Google Drive" : "העלאה"} ·{" "}
                {formatDate(item.createdAt)}
              </div>
            </div>
            <StatusBadge status={item.status} />
          </Link>

          <button
            onClick={() => handleDelete(item.id, item.fileName)}
            disabled={deletingId === item.id}
            title="מחיקה"
            aria-label="מחיקה"
            className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            {deletingId === item.id ? (
              <span className="text-xs">מוחק...</span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
