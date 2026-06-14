import type {
  TranscriptionProvider,
  StartTranscriptionInput,
  TranscriptionResult,
} from "./types";
import type { SpeakerSegment } from "../schema";
import { fetchLarge } from "../http";

const API_BASE = "https://api.assemblyai.com/v2";

type AAIUtterance = {
  speaker: string;
  text: string;
  start: number;
  end: number;
};

type AAITranscript = {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text: string | null;
  utterances: AAIUtterance[] | null;
  error: string | null;
};

function getApiKey(): string {
  const key = process.env.ASSEMBLYAI_API_KEY;
  if (!key) {
    throw new Error(
      "ASSEMBLYAI_API_KEY is not set. הגדר את מפתח ה-API ב-.env.local",
    );
  }
  return key;
}

/**
 * ספק תמלול מבוסס AssemblyAI.
 * תומך בעברית (language_code) וזיהוי דוברים (speaker_labels),
 * ומשתמש ב-webhook במקום polling.
 */
export const assemblyAIProvider: TranscriptionProvider = {
  async uploadAudio(data: ArrayBuffer): Promise<{ url: string }> {
    // timeout מורחב — העלאת קבצים גדולים ל-AssemblyAI
    const res = await fetchLarge(`${API_BASE}/upload`, {
      method: "POST",
      headers: {
        Authorization: getApiKey(),
        "Content-Type": "application/octet-stream",
      },
      body: data,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`AssemblyAI upload failed (${res.status}): ${body}`);
    }

    const json = (await res.json()) as { upload_url: string };
    return { url: json.upload_url };
  },

  async startTranscription(
    input: StartTranscriptionInput,
  ): Promise<{ providerId: string }> {
    const res = await fetch(`${API_BASE}/transcript`, {
      method: "POST",
      headers: {
        Authorization: getApiKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: input.audioUrl,
        language_code: input.languageCode,
        speaker_labels: true,
        webhook_url: input.webhookUrl,
        ...(input.webhookAuthHeaderName && input.webhookAuthHeaderValue
          ? {
              webhook_auth_header_name: input.webhookAuthHeaderName,
              webhook_auth_header_value: input.webhookAuthHeaderValue,
            }
          : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`AssemblyAI create failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as AAITranscript;
    return { providerId: data.id };
  },

  async fetchResult(providerId: string): Promise<TranscriptionResult> {
    const res = await fetch(`${API_BASE}/transcript/${providerId}`, {
      headers: { Authorization: getApiKey() },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`AssemblyAI fetch failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as AAITranscript;

    const speakers: SpeakerSegment[] | null = data.utterances
      ? data.utterances.map((u) => ({
          speaker: u.speaker,
          text: u.text,
          start: u.start,
          end: u.end,
        }))
      : null;

    return {
      status: data.status,
      text: data.text,
      speakers,
      error: data.error,
    };
  },
};
