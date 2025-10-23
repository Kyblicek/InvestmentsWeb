import express from "express";
import { handler as astroHandler } from "./dist/server/entry.mjs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ absolutní cesta k Astro build složce
const clientPath = path.join(__dirname, "dist", "client");

// 🧩 DEBUG výpisy
console.log("🧩 __dirname:", __dirname);
console.log("🧩 exists dist?", fs.existsSync(path.join(__dirname, "dist")));
console.log("🧩 exists web/dist?", fs.existsSync(path.join(__dirname, "web", "dist")));
console.log("🧩 Serving static files from:", clientPath);

const app = express();

// 🧱 Static files
app.use("/_astro", express.static(path.resolve(clientPath, "_astro"), { maxAge: "1y" }));
app.use("/assets", express.static(path.resolve(clientPath, "assets"), { maxAge: "1y" }));
app.use("/favicon_io", express.static(path.resolve(clientPath, "favicon_io"), { maxAge: "1y" }));

// ✅ explicitně přidej root fallback
app.use("/", express.static(clientPath, { maxAge: "1y" }));

// ✅ všechno ostatní → Astro SSR
app.use(astroHandler);

// 🚀 Start
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
