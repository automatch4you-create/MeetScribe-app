import { STATUS_LABELS, STATUS_COLORS } from "@/lib/format";
import type { TranscriptionStatus } from "@/lib/schema";

export function StatusBadge({ status }: { status: TranscriptionStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {status === "processing" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}
