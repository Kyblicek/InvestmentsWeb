// server.mjs
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { handler as ssrHandler } from "./dist/server/entry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ✅ Přesná absolutní cesta (Railway = /app)
const clientPath = path.resolve(__dirname, "dist/client");
console.log("📁 Serving static files from:", clientPath);

app.use(express.static(clientPath));
app.use("/assets", express.static(clientPath));
app.use(ssrHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Astro 4 server running on http://localhost:${PORT}`);
});
