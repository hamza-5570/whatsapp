import express from "express";
import pkg from "whatsapp-web.js";
const { Client, RemoteAuth } = pkg;
import {
  getMongoStore,
  getSessionData,
  saveSessionData,
  removeSessionData,
} from "./sessionStore.js";
import QRCode from "qrcode";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3800;

app.use(express.json());
app.use(cors());

const clients = new Map();
const qrCodes = new Map();

// 🧠 Create WhatsApp client per user
async function createClient(userId) {
  const store = await getMongoStore();
  console.log("MongoStore initialized", store);
  const client = new Client({
    authStrategy: new RemoteAuth({
      store,
      clientId: userId,
      backupSyncIntervalMs: 300000, // optional backup interval
      dataPath: null,
    }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  // 🔐 QR Code Handling
  client.on("qr", async (qr) => {
    console.log(`QR received for ${userId}`);
    try {
      const qrDataUrl = await QRCode.toDataURL(qr);
      qrCodes.set(userId, qrDataUrl);
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
  });

  // ✅ Ready Event
  client.on("ready", () => {
    console.log(`Client ${userId} is ready!`);
    qrCodes.delete(userId);
  });

  // 📌 Authenticated (Backup method)
  client.on("authenticated", async (session) => {
    console.log(`Client ${userId} authenticated`);
    await saveSessionData(userId, session); // Optional
  });

  // ❌ Auth Failure
  client.on("auth_failure", (msg) => {
    console.error(`Auth failure for ${userId}:`, msg);
  });

  // 🔌 Disconnected
  client.on("disconnected", async (reason) => {
    console.log(`Client ${userId} disconnected: ${reason}`);
    clients.delete(userId);
    qrCodes.delete(userId);
    await removeSessionData(userId); // Optional backup cleanup
  });

  client.initialize();
  clients.set(userId, client);

  return client;
}

// 🔄 Get or Create Client
async function getClient(userId) {
  if (!clients.has(userId)) {
    return await createClient(userId);
  }
  return clients.get(userId);
}

// 🕓 Wait for QR
function waitForQR(userId, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const qr = qrCodes.get(userId);
      if (qr) {
        clearInterval(interval);
        resolve(qr);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error("QR code timeout"));
      }
    }, 500);
  });
}

// 📲 GET QR Code Endpoint
app.get("/qr/:userId", async (req, res) => {
  const { userId } = req.params;
  await getClient(userId);

  try {
    const qr = await waitForQR(userId);
    res.json({ success: true, qr });
  } catch (err) {
    res.status(408).json({ success: false, message: err.message });
  }
});

// 💬 Send Message Endpoint
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
    res.json({ success: true, message: "Message sent!" });
  } catch (err) {
    console.error("Send Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to send message." });
  }
});

// 🏠 Default Route
app.get("/", (req, res) => {
  res.send("WhatsApp Multi-User API (RemoteAuth + MongoDB)");
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
