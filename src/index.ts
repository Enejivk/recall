import express from "express";
import { createUserTable } from "./createTables";

const PORT = 5000;
const app = express();

function createTableIfNotExit() {
  createUserTable();
}

app.get("/health", (req, res) => {
  return res.json({ msg: "is working" });
});

app.listen(5000, () => {
  console.log("server started at ", PORT);
});
