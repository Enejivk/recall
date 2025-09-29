import express from "express";
import createUserTable from "./createTables";
import authRoutes from "./auth";
import type { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middlewares/authMiddleware";
import questionRoute from "./activeRecall/activeRecall";

const PORT = 3000;
const app = express();

// Middleware
app.use(logger);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use(authMiddleware);
app.use("/questions", questionRoute);


app.use(express.urlencoded({ extended: true }));
function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
}

async function createTableIfNotExit() {
  createUserTable();
}

// createTableIfNotExit();


// Routes
app.get("/", (req, res) => {
  return res.json({ msg: "is working" });
});



app.listen(PORT, () => {
  console.log("server started at ", PORT);
});
