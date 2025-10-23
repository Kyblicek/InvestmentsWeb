import express from "express";
import { handler as astroHandler } from "./dist/server/entry.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ absolutní cesta k Astro build složce
const clientPath = path.join(__dirname, "web", "dist", "client");
console.log("🧩 Serving static files from:", clientPath);

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
