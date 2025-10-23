import express from "express";
import { handler as astroHandler } from "./dist/server/entry.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// 🧱 Absolutní cesty
const clientPath = path.join(__dirname, "dist", "client");
const astroPath = path.join(clientPath, "_astro");
const assetsPath = path.join(clientPath, "assets");
const faviconPath = path.join(clientPath, "favicon_io");

// 🪄 1️⃣ hlavní statická složka
app.use(express.static(clientPath, { maxAge: "1y", index: false }));

// 🪄 2️⃣ explicitně servíruj Astro + assets + favicon
app.use("/_astro", express.static(astroPath, { maxAge: "1y" }));
app.use("/assets", express.static(assetsPath, { maxAge: "1y" }));
app.use("/favicon_io", express.static(faviconPath, { maxAge: "1y" }));

// 🪄 3️⃣ fallback pro čisté kořenové CSS (např. /index.LLf_g-uo.css)
app.get("/:file", (req, res, next) => {
  const file = req.params.file;
  if (file.endsWith(".css")) {
    res.sendFile(path.join(astroPath, file));
  } else {
    next();
  }
});

// 🪄 4️⃣ všechno ostatní -> Astro SSR
app.use(astroHandler);

// ✅ start
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
