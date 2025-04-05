import express from "express";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import QRCode from "qrcode";
import cors from "cors";
import {
  getSessionData,
  saveSessionData,
  removeSessionData,
} from "./sessionStore.js"; // Implement these functions to interact with your database

const app = express();
const PORT = process.env.PORT || 3800;

app.use(express.json());
app.use(cors());

const clients = new Map();
const qrCodes = new Map();

// Create and initialize WhatsApp client per user
async function createClient(userId) {
  const sessionData = await getSessionData(userId);

  // If session data exists, pass it to the client directly
  const client = new Client({
    authStrategy: sessionData
      ? new LocalAuth({ session: sessionData }) // Use session from DB
      : new LocalAuth(), // Fallback if session is not in DB
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", async (qr) => {
    console.log(`QR received for ${userId}`);
    try {
      const qrDataUrl = await QRCode.toDataURL(qr);
      qrCodes.set(userId, qrDataUrl); // Store the base64 string in memory
      console.log(`QR Code generated for ${userId}`);
    } catch (err) {
      console.error("Error generating QR:", err);
    }
  });

  client.on("ready", () => {
    console.log(`Client ${userId} is ready!`);
    qrCodes.delete(userId); // Remove QR once authenticated
  });

  client.on("authenticated", async (session) => {
    console.log(`Client ${userId} authenticated.`);
    await saveSessionData(userId, session); // Save session in DB
  });

  client.on("auth_failure", (msg) => {
    console.error(`Auth failure for ${userId}:`, msg);
  });

  client.on("disconnected", async (reason) => {
    console.log(`Client ${userId} disconnected: ${reason}`);
    clients.delete(userId);
    qrCodes.delete(userId);
    await removeSessionData(userId); // Remove session on disconnect
  });

  client.initialize();
  clients.set(userId, client);
  return client;
}

// Get or create WhatsApp client
async function getClient(userId) {
  if (!clients.has(userId)) {
    return await createClient(userId);
  }
  return clients.get(userId);
}

// Helper function to wait for QR code generation or timeout
function waitForQR(userId, timeoutMs = 10000) {
  // Extended timeout to 10 seconds
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const qr = qrCodes.get(userId);
      if (qr) {
        console.log(`QR code for ${userId} is ready.`);
        clearInterval(interval);
        resolve(qr);
      } else if (Date.now() - start > timeoutMs) {
        console.error(`QR code generation timed out for ${userId}`);
        clearInterval(interval);
        reject(new Error("QR generation timeout exceeded."));
      }
    }, 5000); // Check every 500ms
  });
}

// API to get base64 QR code
app.get("/qr/:userId", async (req, res) => {
  const { userId } = req.params;

  // Ensure the client is created and QR code generation starts
  await getClient(userId);

  // Wait for the QR code to be generated or timeout after 5 seconds
  try {
    const qr = await waitForQR(userId, 10000);
    return res.json({ success: true, qr }); // Send QR code as base64 string
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

// Root API
app.get("/", (req, res) => {
  res.send("WhatsApp Multi-User SaaS with Database Session Storage");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
