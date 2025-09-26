import express from "express";
import { createUserTable } from "./createTables";
import authRoutes from "./auth";
import type { Request, Response, NextFunction } from "express";

const PORT = 3000;
const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
}

app.use(logger);

function createTableIfNotExit() {
  createUserTable();
}

createTableIfNotExit()
// Routes
app.get("/", (req, res) => {
  return res.json({ msg: "is working" });
});

app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log("server started at ", PORT);
});
