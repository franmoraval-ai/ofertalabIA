import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

let cachedClient: ReturnType<typeof postgres> | undefined;
let cachedDb: DrizzleClient | undefined;

export function getDb(): DrizzleClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL no está configurada. Copia la connection string de Supabase (pooler, modo transacción) en .env.local y en las variables de entorno de Vercel.",
    );
  }

  if (!cachedDb) {
    // `prepare: false` es obligatorio con el pooler de Supabase en modo transacción
    // (Supavisor/PgBouncer) y funciona bien en entornos serverless como Vercel.
    cachedClient = postgres(url, { prepare: false });
    cachedDb = drizzle(cachedClient, { schema });
  }

  return cachedDb;
}
