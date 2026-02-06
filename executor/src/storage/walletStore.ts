import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import readline from "readline";
import { logger } from "../utils/logger";

export interface StoredWallet {
  iv: string;
  encryptedKey: string;
}

const DIR = path.join(os.homedir(), ".zync-executor");
const FILE = path.join(DIR, "wallet.json");


async function promptPassword(question = "Enter password: "): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    process.stdout.write(question);

    const stdin = process.stdin;
    stdin.setRawMode?.(true);

    let password = "";

    stdin.on("data", (char: Buffer) => {
      const key = char.toString();

      if (key === "\n" || key === "\r" || key === "\u0004") {
        stdin.setRawMode?.(false);
        rl.close();
        process.stdout.write("\n");
        resolve(password);
      } else if (key === "\u0003") {
        process.exit();
      } else if (key === "\u007f") {
        password = password.slice(0, -1);
      } else {
        password += key;
      }
    });
  });
}

function deriveKey(password: string): Buffer {
  return crypto.scryptSync(password, "zync-salt", 32);
}

export async function saveWallet(privateKey: `0x${string}`) {
  if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR, { recursive: true });
  }

  const password = await promptPassword("Set wallet password: ");

  const iv = crypto.randomBytes(16);
  const key = deriveKey(password);

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  const encrypted =
    cipher.update(privateKey, "utf8", "hex") + cipher.final("hex");

  const data: StoredWallet = {
    iv: iv.toString("hex"),
    encryptedKey: encrypted,
  };

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  logger.info("Wallet saved securely.");
}

export async function loadWallet(): Promise<`0x${string}`> {
  if (!fs.existsSync(FILE)) {
    throw new Error(
      "Wallet not configured. Run: zync-cli config-wallet --private-key <pk>"
    );
  }

  const raw = fs.readFileSync(FILE, "utf8");
  const stored: StoredWallet = JSON.parse(raw);

  const password = await promptPassword("Enter wallet password: ");
  const key = deriveKey(password);

  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      key,
      Buffer.from(stored.iv, "hex")
    );

    const decrypted =
      decipher.update(stored.encryptedKey, "hex", "utf8") +
      decipher.final("utf8");

    if (!decrypted.startsWith("0x")) {
      throw new Error("Invalid decrypted key");
    }

    return decrypted as `0x${string}`;
  } catch {
    throw new Error("Incorrect password or corrupted wallet.");
  }
}
