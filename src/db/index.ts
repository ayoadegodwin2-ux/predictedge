import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import * as schema from "./schema";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

/**
 * Global cache to prevent multiple connection pools during Next.js hot-reload in development
 */
declare global {
  var _postgresClient: postgres.Sql | undefined;
}

let client: postgres.Sql;

if (process.env.NODE_ENV === "production") {
  // In production, instantiate directly
  client = postgres(connectionString || "", {
    prepare: false, // Recommended for Supabase transaction pooler (port 6543)
  });
} else {
  // In development, preserve client across HMR cycles
  if (!global._postgresClient) {
    global._postgresClient = postgres(connectionString || "postgresql://postgres:postgres@localhost:5432/postgres", {
      prepare: false,
    });
  }
  client = global._postgresClient;
}

export const db = drizzle(client, { schema });
export { schema };

