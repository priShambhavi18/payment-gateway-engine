const fs = require("fs");
const path = require("path");
const pool = require("../src/config/db");

async function runMigrations() {
  try {
    // Create migration tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.join(__dirname, "../migrations");

    const files = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      // Check if migration already executed
      const result = await pool.query(
        `
        SELECT * FROM schema_migrations
        WHERE filename = $1
        `,
        [file]
      );

      if (result.rows.length > 0) {
        console.log(`Skipping already executed migration: ${file}`);
        continue;
      }

      console.log(`Running migration: ${file}`);

      const filePath = path.join(migrationsDir, file);

      const sql = fs.readFileSync(filePath, "utf8");

      // Execute migration SQL
      await pool.query(sql);

      // Mark migration as executed
      await pool.query(
        `
        INSERT INTO schema_migrations (filename)
        VALUES ($1)
        `,
        [file]
      );

      console.log(`Migration completed: ${file}`);
    }

    console.log("All migrations completed");

    process.exit(0);

  } catch (err) {
    console.error("Migration failed", err);

    process.exit(1);
  }
}

runMigrations();
