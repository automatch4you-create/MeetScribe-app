"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";

type Phase = "idle" | "uploading" | "starting";

export function UploadZone({ onUploaded }: { onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setError(null);
    setFileName(file.name);
    setProgress(0);
    setPhase("uploading");

    try {
      // העלאה ישירה מהדפדפן ל-Vercel Blob (עם בר התקדמות מובנה)
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        contentType: file.type || undefined,
        onUploadProgress: (e) => setProgress(Math.round(e.percentage)),
      });

      // ההעלאה הסתיימה — יוצרים רשומה ומתחילים תמלול
      setPhase("starting");
      const res = await fetch("/api/transcriptions/from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blob.url, fileName: file.name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "התחלת התמלול נכשלה");
      }

      reset();
      onUploaded();
    } catch (err) {
      reset();
      setError(err instanceof Error ? err.message : "ההעלאה נכשלה");
    }
  }

  function reset() {
    setPhase("idle");
    setProgress(0);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFiles(files: FileList | null) {
    if (files && files[0]) uploadFile(files[0]);
  }

  const busy = phase !== "idle";

  return (
    <div>
      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) handleFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition ${
          dragging
            ? "border-brand bg-brand-light"
            : "border-slate-300 bg-white hover:border-brand-border hover:bg-slate-50"
        } ${busy ? "pointer-events-none" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {phase === "idle" && (
          <>
            <div className="text-4xl">🎙️</div>
            <div className="text-lg font-semibold text-slate-800">
              גררו קובץ הקלטה לכאן
            </div>
            <div className="text-sm text-slate-500">
              או לחצו לבחירת קובץ אודיו / וידאו (עד 500MB)
            </div>
          </>
        )}

        {busy && (
          <div className="w-full max-w-sm">
            <div className="mb-2 truncate text-sm font-medium text-slate-700">
              {fileName}
            </div>

            {/* בר התקדמות */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  phase === "starting"
                    ? "animate-pulse bg-amber-400"
                    : "bg-brand"
                }`}
                style={{ width: `${phase === "starting" ? 100 : progress}%` }}
              />
            </div>

            <div className="mt-2 text-sm text-slate-600">
              {phase === "uploading"
                ? `מעלה... ${progress}%`
                : "ההעלאה הושלמה — מתחיל תמלול ב-AssemblyAI..."}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
