const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KLASH NETWORK API is running"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "KLASH NETWORK",
    status: "online"
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`KLASH NETWORK API running on port ${PORT}`);
});
