CREATE TABLE "transcriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text DEFAULT 'upload' NOT NULL,
	"file_name" text NOT NULL,
	"audio_url" text,
	"assemblyai_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"language" text DEFAULT 'he' NOT NULL,
	"text" text,
	"speakers" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
