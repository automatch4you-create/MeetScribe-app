import { readFileSync } from "node:fs";
import type { Config } from "drizzle-kit";

// טעינת DATABASE_URL מ-.env.local (drizzle-kit לא טוען אותו אוטומטית)
function loadDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const env = readFileSync(".env.local", "utf8");
    const match = env.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
    if (match) return match[1];
  } catch {
    // אין .env.local — ייפול לערך ריק
  }
  return "";
}

export default {
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: loadDatabaseUrl(),
  },
} satisfies Config;
