import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * חיבור ל-Neon Postgres דרך הדרייבר ה-serverless.
 * נוצר באופן עצל (lazy) כדי שהאפליקציה לא תקרוס בזמן ה-build/טעינה
 * אם DATABASE_URL עדיין לא הוגדר.
 */
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. הגדר את כתובת ה-Neon Postgres ב-.env.local",
    );
  }

  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

export { schema };
