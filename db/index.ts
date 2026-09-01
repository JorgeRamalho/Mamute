import { drizzle } from "drizzle-orm/netlify-db";
import * as schema from "./schema.js";

function resolveDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.NETLIFY_DB_URL,
    process.env.NETLIFY_DATABASE_URL,
    process.env.DATABASE_URL,
  ];

  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }

  return undefined;
}

const databaseUrl = resolveDatabaseUrl();
export const db = databaseUrl ? drizzle(databaseUrl, { schema }) : drizzle({ schema });
