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

    // Review 表新增字段
    await client.query(`
      ALTER TABLE "reviews"
        ADD COLUMN IF NOT EXISTS "tags" TEXT NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "reply" TEXT,
        ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP(3)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_reviews_rating" ON "reviews"("rating")
    `);

    await client.query(`COMMIT`);

    console.log("✅ Migration completed!");

    // 验证列是否添加
    const cols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'reviews' ORDER BY ordinal_position
    `);
    console.log("Reviews columns:", cols.rows.map((r) => `${r.column_name}(${r.data_type})`).join(", "));
  } catch (err) {
    await client.query(`ROLLBACK`).catch(() => {});
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
