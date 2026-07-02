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

    // 收藏表
    await client.query(`
      CREATE TABLE IF NOT EXISTS "favorites" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "appId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "appId")
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "favorites_userId_idx" ON "favorites"("userId")
    `);

    // 通知表
    await client.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL DEFAULT '',
        "link" TEXT,
        "read" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId")
    `);

    await client.query(`COMMIT`);

    console.log("✅ Migration completed!");
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    console.log("Tables:", tables.rows.map(r => r.table_name).join(", "));
  } catch (err) {
    await client.query(`ROLLBACK`).catch(() => {});
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
