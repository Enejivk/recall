import pool from "./db";

export async function createUserTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(300) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
  try {
    await pool.query(createTableQuery);
    console.log("user table created successfully");
  } catch (error) {
    console.log("There was an error creating the user table");
  }
}