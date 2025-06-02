import dotenv from "dotenv";
dotenv.config();
import crypto from "crypto";

function encrypt(text) {
  const iv = process.env.IV;
  if (!iv) {
    throw new Error("IV is not defined in the environment variables.");
  }
  const key = process.env.SECRET_KEY;
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(key, "hex"),
    Buffer.from(iv, "hex")
  );
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

export default encrypt;
