import mongoose from "mongoose";
import pkg from "wwebjs-mongo";
const { MongoStore } = pkg;

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://ameerhamza0331:Hamza5570@cluster0.he5fe.mongodb.net/whatsapp?retryWrites=true&w=majority";

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Optional: Mongoose session schema (used manually if needed)
const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  session: { type: Object, required: true },
});

const Session = mongoose.model("Session", sessionSchema);

// Custom getSession, saveSession helpers if you're not using RemoteAuth backup (for manual session store)
export async function getSessionData(userId) {
  try {
    const record = await Session.findOne({ userId });
    return record ? record.session : null;
  } catch (err) {
    console.error("Error fetching session data:", err);
    return null;
  }
}

export async function saveSessionData(userId, session) {
  try {
    await Session.findOneAndUpdate(
      { userId },
      { session },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("Error saving session data:", err);
  }
}

export async function removeSessionData(userId) {
  try {
    await Session.deleteOne({ userId });
  } catch (err) {
    console.error("Error deleting session data:", err);
  }
}

// ✅ CORRECT WAY: Return instance of MongoStore (used by RemoteAuth)
export async function getMongoStore() {
  const store = new MongoStore({ mongoose }); // no need for .init()
  return store;
}
