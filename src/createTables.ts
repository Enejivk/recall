import pool from "./db";

export async function createTables() {
  const createAllTables = `
    -- Enable UUID generator
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(100) UNIQUE NOT NULL,
      passwordHash VARCHAR(300) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Questions table
    CREATE TABLE IF NOT EXISTS questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question TEXT NOT NULL,
      official_answer TEXT,
      has_code BOOLEAN DEFAULT FALSE,
      number_of_seen INTEGER DEFAULT 0,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE
    );

    -- Answers table
    CREATE TABLE IF NOT EXISTS answers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      text TEXT NOT NULL,
      question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE
    );

    -- Feedback table
    CREATE TABLE IF NOT EXISTS feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      text TEXT NOT NULL,
      answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  try {
    await pool.query(createAllTables);
    console.log("✅ All tables created successfully in one go");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
  } finally {
    await pool.end();
  }
}

export default createTables;


