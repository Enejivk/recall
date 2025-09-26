import { error } from "console";
import pool from "./db";

export async function createUserTable() {
   await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users(
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(100) UNIQUE NOT NULL,
        passwordHash VARCHAR(300) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
  try {
    await pool.query(createTableQuery);
    console.log("user table created successfully");
  } catch (error) {
    console.log("There was an error creating the user table", error);
  }
}
