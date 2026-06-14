"use client";

import { useState } from "react";
import { UploadZone } from "./UploadZone";
import { DriveInput } from "./DriveInput";

type Tab = "upload" | "drive";

export function SourcePicker({ onAdded }: { onAdded: () => void }) {
  const [tab, setTab] = useState<Tab>("upload");

  return (
    <div>
      <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1 text-sm">
        <button
          onClick={() => setTab("upload")}
          className={`rounded-md px-4 py-1.5 font-medium transition ${
            tab === "upload"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          העלאת קובץ
        </button>
        <button
          onClick={() => setTab("drive")}
          className={`rounded-md px-4 py-1.5 font-medium transition ${
            tab === "drive"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Google Drive
        </button>
      </div>

      {tab === "upload" ? (
        <UploadZone onUploaded={onAdded} />
      ) : (
        <DriveInput onAdded={onAdded} />
      )}
    </div>
  );
}
