const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const VTU_BASE_URL = "https://vtu.ng/wp-json";

// Home
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KLASH NETWORK API is running"
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "KLASH NETWORK",
    status: "online"
  });
});

// Get real data plans
app.get("/api/data-plans/:network", async (req, res) => {
  try {
    const network = req.params.network.toLowerCase();

    const allowedNetworks = ["mtn", "airtel", "glo", "9mobile"];

    if (!allowedNetworks.includes(network)) {
      return res.status(400).json({
        success: false,
        message: "Invalid network"
      });
    }

    const response = await fetch(
      `${VTU_BASE_URL}/api/v2/variations/data?service_id=${network}`
    );

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "Unable to retrieve data plans",
        provider: result
      });
    }

    res.json({
      success: true,
      network,
      plans: result.data || []
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving data plans"
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`KLASH NETWORK API running on port ${PORT}`);
});
