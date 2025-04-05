import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://ameerhamza0331:Hamza5570@cluster0.he5fe.mongodb.net/whatsapp?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  session: { type: Object, required: true },
});

const Session = mongoose.model("Session", sessionSchema);

// 🔍 Retrieve session data
export async function getSessionData(userId) {
  try {
    const record = await Session.findOne({ userId });
    return record ? record.session : null;
  } catch (err) {
    console.error("Error fetching session data:", err);
    return null;
  }
}

// 💾 Save or update session data
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

// ❌ Remove session data
export async function removeSessionData(userId) {
  try {
    await Session.deleteOne({ userId });
  } catch (err) {
    console.error("Error deleting session data:", err);
  }
}
