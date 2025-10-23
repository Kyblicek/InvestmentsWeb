import express from "express";
import { handler as astroHandler } from "./dist/server/entry.mjs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🧩 Debug info
console.log("🧩 __dirname:", __dirname);
console.log("🧩 exists dist?", fs.existsSync(path.join(__dirname, "dist")));
console.log("🧩 Serving static files from:", path.join(__dirname, "dist", "client"));

// ✅ Static files for public assets
app.use(express.static(path.join(__dirname, "dist", "client"), { maxAge: "1y" }));

// ✅ Let Astro handle everything else (including /_astro CSS)
app.use(astroHandler);

// 🚀 Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
