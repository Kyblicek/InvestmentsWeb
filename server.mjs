// server.mjs
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { handler as ssrHandler } from "./dist/server/entry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// 🔹 Log cesty (jen pro debug, můžeš smazat)
console.log("📁 Serving static files from:", path.join(__dirname, "dist/client"));

// 🧠 SSR handler musí být první
app.use(ssrHandler);

// 🧩 Statika — CSS, obrázky, favicon, apod.
app.use(express.static(path.join(__dirname, "dist/client")));

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
