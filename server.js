const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const VTU_BASE_URL = "https://vtu.ng/wp-json";

// ==========================================
// VTU.ng AUTHENTICATION
// ==========================================

let cachedToken = null;
let tokenTime = 0;

async function getVTUToken() {
  // Reuse the token for up to 6 days
  if (
    cachedToken &&
    Date.now() - tokenTime < 6 * 24 * 60 * 60 * 1000
  ) {
    return cachedToken;
  }

  const username = process.env.VTU_USERNAME;
  const password = process.env.VTU_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "VTU_USERNAME or VTU_PASSWORD is missing in Render Environment Variables"
    );
  }

  const response = await fetch(
    `${VTU_BASE_URL}/jwt-auth/v1/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    }
  );

  const result = await response.json();

  if (!response.ok || !result.token) {
    console.error("VTU authentication response:", result);

    throw new Error(
      result.message || "VTU.ng authentication failed"
    );
  }

  cachedToken = result.token;
  tokenTime = Date.now();

  return cachedToken;
}

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KLASH NETWORK API is running"
  });
});

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "KLASH NETWORK",
    status: "online"
  });
});

// ==========================================
// VTU AUTHENTICATION TEST
// ==========================================

app.get("/api/vtu-test", async (req, res) => {
  try {
    await getVTUToken();

    res.json({
      success: true,
      message: "VTU.ng authentication successful"
    });

  } catch (error) {
    console.error("VTU test error:", error.message);

    res.status(500).json({
      success: false,
      message: "VTU.ng authentication failed"
    });
  }
});

// ==========================================
// GET REAL DATA PLANS
// ==========================================

app.get("/api/data-plans/:network", async (req, res) => {
  try {
    const network = req.params.network.toLowerCase();

    const allowedNetworks = [
      "mtn",
      "airtel",
      "glo",
      "9mobile"
    ];

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
        message: "Unable to retrieve data plans"
      });
    }

    res.json({
      success: true,
      network: network,
      plans: result.data || []
    });

  } catch (error) {
    console.error(
      "Data plans error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Server error while retrieving data plans"
    });
  }
});

// ==========================================
// PURCHASE DATA
// ==========================================

app.post("/api/purchase-data", async (req, res) => {
  try {

    // SAFETY SWITCH
    // Keep LIVE_PURCHASES=false for now.
    if (process.env.LIVE_PURCHASES !== "true") {
      return res.status(403).json({
        success: false,
        message: "Live purchases are currently disabled."
      });
    }

    const {
      phone,
      service_id,
      variation_id
    } = req.body;

    if (!phone || !service_id || !variation_id) {
      return res.status(400).json({
        success: false,
        message:
          "Phone, network and data plan are required."
      });
    }

    const allowedNetworks = [
      "mtn",
      "airtel",
      "glo",
      "9mobile"
    ];

    const network = service_id.toLowerCase();

    if (!allowedNetworks.includes(network)) {
      return res.status(400).json({
        success: false,
        message: "Invalid network."
      });
    }

    const cleanPhone = phone.replace(/\s+/g, "");

    if (!/^(0|\+234)\d{10,13}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number."
      });
    }

    const requestId =
      `KLASH_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const token = await getVTUToken();

    const response = await fetch(
      `${VTU_BASE_URL}/api/v2/data`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          request_id: requestId,
          phone: cleanPhone,
          service_id: network,
          variation_id: String(variation_id)
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message:
          result.message || "Data purchase failed."
      });
    }

    res.json({
      success: true,
      message:
        result.message ||
        "Data purchase submitted.",
      data: result.data || null
    });

  } catch (error) {
    console.error(
      "Purchase error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while processing purchase."
    });
  }
});

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `KLASH NETWORK API running on port ${PORT}`
  );
});
