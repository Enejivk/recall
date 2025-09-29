import pool from "./db";

export async function createTables() {
  const createAllTables = `
    -- Enable UUID generator
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(300) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    CREATE TABLE answers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      feedback TEXT NOT NULL,
      user_answer TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
    CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
    CREATE INDEX IF NOT EXISTS idx_answers_user_id ON answers(user_id);
  `;

  try {
    await pool.query(createAllTables);
    console.log("✅ All tables created successfully (safe mode)");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
  } finally {
    await pool.end();
  }
}

export default createTables;
