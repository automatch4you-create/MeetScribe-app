import { assemblyAIProvider } from "./assemblyai";
import type { TranscriptionProvider } from "./types";

/**
 * הספק הפעיל של האפליקציה. כדי להחליף ספק — שנה כאן בלבד.
 */
export const provider: TranscriptionProvider = assemblyAIProvider;

export * from "./types";
