import { config as loadDotenv } from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

loadDotenv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined || databaseUrl === "") {
  throw new Error("DATABASE_URL is required to run database migrations.");
}

const migrationDirectory = fileURLToPath(new URL("../../../db/migrations/", import.meta.url));
const pool = new Pool({ connectionString: databaseUrl });

try {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       name TEXT PRIMARY KEY,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`
  );
  const migrationNames = (await readdir(migrationDirectory))
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort();

  for (const fileName of migrationNames) {
    const migrationName = fileName.replace(/\.sql$/, "");
    const existing = await pool.query<{ name: string }>(
      "SELECT name FROM schema_migrations WHERE name = $1",
      [migrationName]
    );
    if (existing.rowCount === 1) {
      console.log(`Migration ${migrationName} is already applied.`);
      continue;
    }

    const sql = await readFile(`${migrationDirectory}${fileName}`, "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [migrationName]);
      await client.query("COMMIT");
      console.log(`Migration ${migrationName} applied.`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}
