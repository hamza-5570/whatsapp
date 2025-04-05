import express from "express";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

import QRCode from "qrcode";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3800;

app.use(express.json());
app.use(cors());

const clients = new Map();
const qrCodes = new Map(); // Temporary in-memory QR storage

// Create and initialize WhatsApp client per user
function createClient(userId) {
  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: `./sessions/${userId}`, // You can clear this folder on logout
    }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", async (qr) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(qr);
      qrCodes.set(userId, qrDataUrl);
    } catch (err) {
      console.error("Error generating QR:", err);
    }
  });

  client.on("ready", () => {
    console.log(`Client ${userId} is ready!`);
    qrCodes.delete(userId); // Remove QR once authenticated
  });

  client.on("authenticated", () => {
    console.log(`Client ${userId} authenticated.`);
  });

  client.on("auth_failure", (msg) => {
    console.error(`Auth failure for ${userId}:`, msg);
  });

  client.on("disconnected", (reason) => {
    console.log(`Client ${userId} disconnected: ${reason}`);
    clients.delete(userId);
    qrCodes.delete(userId);
  });

  client.initialize();
  clients.set(userId, client);
  return client;
}

// Get or create WhatsApp client
function getClient(userId) {
  if (!clients.has(userId)) {
    return createClient(userId);
  }
  return clients.get(userId);
}

function waitForQR(userId, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const qr = qrCodes.get(userId);
      if (qr) {
        clearInterval(interval);
        resolve(qr);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error("Timeout"));
      }
    }, 300);
  });
}
// API to get base64 QR code
app.get("/qr/:userId", async (req, res) => {
  const { userId } = req.params;
  getClient(userId); // this starts QR gen process if not already

  // Wait until QR is ready or timeout (5 seconds)
  try {
    const qr = await waitForQR(userId, 5000);
    return res.json({ success: true, qr });
  } catch (err) {
    return res
      .status(408)
      .json({ success: false, message: "QR not generated in time." });
  }
});

// Send message API
app.post("/send-message/:userId", async (req, res) => {
  const { userId } = req.params;
  const { phoneNumber, message } = req.body;

  const client = clients.get(userId);
  if (!client) {
    return res
      .status(400)
      .json({ success: false, message: "Client not ready." });
  }

  try {
    const chatId = `${phoneNumber}@c.us`;
    await client.sendMessage(chatId, message);
    return res.json({ success: true, message: "Message sent!" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send message." });
  }
});

app.get("/", (req, res) => {
  res.send("WhatsApp Multi-User SaaS - QR not saved to disk");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
