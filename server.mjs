// server.mjs (Astro 4 compatible)
import express from "express";
import { handler as ssrHandler } from "./dist/server/entry.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// 🚀 statické soubory z Astro buildu
app.use(express.static(path.join(__dirname, "dist/client")));

// 🧠 SSR fallback
app.use(ssrHandler);

const PORT = process.env.PORT || 5050;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Astro 4 server running on http://localhost:${PORT}`);
});
