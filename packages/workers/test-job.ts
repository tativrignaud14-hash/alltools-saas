import { Queue } from "bullmq";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Recréation de __dirname pour ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🔧 Charge le .env depuis la racine du projet
const envPath = join(__dirname, "../../.env");
dotenv.config({ path: envPath });

// 🧩 Vérification que la variable est bien chargée
console.log("📄 .env chargé depuis :", envPath);
console.log("🔍 REDIS_URL =", process.env.REDIS_URL);

if (!process.env.REDIS_URL) {
  throw new Error("❌ REDIS_URL non trouvé dans le .env !");
}

// Création de la queue reliée à Upstash
const queue = new Queue("alltools", {
  connection: {
    url: process.env.REDIS_URL!,
    tls: {}, // important pour Upstash (HTTPS)
  },
});

// Envoi d’un job test
(async () => {
  console.log("🚀 Envoi du job de test vers Redis (Upstash)...");

  await queue.add("image:convert", { message: "Hello depuis le test !" });

  console.log("✅ Job envoyé avec succès !");
  process.exit(0);
})();
