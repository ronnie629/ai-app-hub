require("dotenv").config({ path: ".env" });
const { Client } = require("pg");

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log("Connected!");

    await client.query(`BEGIN`);
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" VARCHAR NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isDeveloper" BOOLEAN NOT NULL DEFAULT false`);
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profession" VARCHAR`);
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "interests" VARCHAR`);
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "workYears" INTEGER`);
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "appDomains" VARCHAR`);
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3)`);
    await client.query(`COMMIT`);

    console.log("✅ Migration completed!");
    const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`);
    console.log("Columns:", res.rows.map(r => r.column_name).join(", "));
  } catch (err) {
    await client.query(`ROLLBACK`).catch(() => {});
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
