"use client";

import { useState } from "react";

export function DriveInput({ onAdded }: { onAdded: () => void }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!input.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "השליפה מ-Drive נכשלה");
      }
      setInput("");
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "השליפה נכשלה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8">
      <div className="mb-3 text-center text-4xl">📁</div>
      <p className="mb-4 text-center text-sm text-slate-500">
        הדביקו קישור שיתוף של Google Drive או file_id
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          dir="ltr"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="https://drive.google.com/file/d/..."
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-brand-border"
        />
        <button
          onClick={submit}
          disabled={loading || !input.trim()}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "מוריד..." : "תמלל"}
        </button>
      </div>
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
