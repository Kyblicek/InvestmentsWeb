import express from "express";
import { handler as astroHandler } from "./dist/server/entry.mjs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const clientPath = path.join(__dirname, "dist", "client");
console.log("🧩 Serving static files from:", clientPath);

// 🧱 Static routes
app.use("/_astro", express.static(path.join(clientPath, "_astro"), { maxAge: "1y" }));
app.use("/assets", express.static(path.join(clientPath, "assets"), { maxAge: "1y" }));
app.use(express.static(clientPath, { maxAge: "1y" }));

// 🧩 Fallback – pokud Express nenašel soubor, zkusíme ručně zkontrolovat cestu
app.use((req, res, next) => {
  const filePath = path.join(clientPath, req.path);
  if (fs.existsSync(filePath)) {
    console.log("🪄 Serving fallback file:", filePath);
    return res.sendFile(filePath);
  }
  next();
});

// ✅ Astro SSR handler
app.use(astroHandler);

// 🚀 Start
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
