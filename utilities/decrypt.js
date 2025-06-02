import dotenv from "dotenv";
dotenv.config();
import crypto from "crypto";
const key = process.env.SECRET_KEY;
const iv = process.env.IV;
function decrypt(encryptedData) {
  const encryptedText = Buffer.from(encryptedData, "base64");
  // Creating Decipher
  let decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key, "hex"),
    Buffer.from(iv, "hex")
  );

  // Updating encrypted text
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  // returns data after decryption
  return decrypted.toString();
}

export default decrypt;
