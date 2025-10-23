import express from "express";
import { handler as astroHandler } from "./dist/server/entry.mjs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const clientPath = path.join(__dirname, "dist", "client");
console.log("🧩 __dirname:", __dirname);
console.log("🧩 exists dist?", fs.existsSync(path.join(__dirname, "dist")));
console.log("🧩 Serving static files from:", clientPath);

// 👉 static assets (images, favicons…)
app.use(express.static(clientPath, { maxAge: "1y" }));

// 👉 everything else – Astro SSR handler (řeší /_astro i CSS)
app.use(astroHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
