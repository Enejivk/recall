import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config()

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
});


pool.on("connect", () => {
    console.log("Connection pool establish with Database")
})


export default pool
