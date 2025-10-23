import express from "express";
import { handler as astroHandler } from "./dist/server/entry.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const clientPath = path.join(__dirname, "dist", "client");

// 🧠 1️⃣  Servíruj všechny statické soubory ze složky dist/client
app.use(express.static(clientPath, {
  maxAge: "1y",
  index: false,
}));

// 🧠 2️⃣  Přidej výslovné cesty, které Astro používá
app.use("/_astro", express.static(path.join(clientPath, "_astro")));
app.use("/assets", express.static(path.join(clientPath, "assets")));
app.use("/favicon_io", express.static(path.join(clientPath, "favicon_io")));

// 🧠 3️⃣  Pro jistotu přidej i public (pokud tam něco zůstalo mimo build)
app.use(express.static(path.join(__dirname, "public")));

// 💫 4️⃣  Všechno ostatní předej Astreu (SSR)
app.use(astroHandler);

// ✅ 5️⃣  Start serveru
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
