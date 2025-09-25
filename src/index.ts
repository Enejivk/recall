import express from "express";

const app = express();
const PORT = 5000;

app.get("/", (req, res) => {
    console.log("how are you doing")
  res.send("Hello ES Modules + TypeScript!");
});



app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
