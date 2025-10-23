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

// ✅ cesta ke klientskému buildu
const clientPath = path.join(__dirname, "dist", "client");

// 🧱 Static files
app.use("/_astro", express.static(path.join(clientPath, "_astro"), { maxAge: "1y" }));
app.use("/assets", express.static(path.join(clientPath, "assets"), { maxAge: "1y" }));
app.use("/favicon_io", express.static(path.join(clientPath, "favicon_io"), { maxAge: "1y" }));
app.use(express.static(clientPath, { maxAge: "1y" }));

// 🪄 vše ostatní přepošli Astro SSR handleru
app.use(astroHandler);

// 🚀 Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
