import express from "express";
import { handler as astroHandler } from "./dist/server/entry.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ absolutní cesta k Astro build složce
const clientPath = path.join(__dirname, "dist", "client");
console.log("🧩 Serving static files from:", clientPath);

// 🧱 Static folders
app.use("/_astro", express.static(path.join(clientPath, "_astro"), { maxAge: "1y" }));
app.use("/assets", express.static(path.join(clientPath, "assets"), { maxAge: "1y" }));
app.use("/favicon_io", express.static(path.join(clientPath, "favicon_io"), { maxAge: "1y" }));

// ✅ Root fallback for CSS a favicon
app.get(/.*\.css$/, (req, res, next) => {
  const target = path.join(clientPath, req.path);
  res.sendFile(target, (err) => {
    if (err) next();
  });
});

app.get("/favicon.ico", (req, res, next) => {
  const target = path.join(clientPath, "favicon.ico");
  res.sendFile(target, (err) => {
    if (err) next();
  });
});

// 🧠 💥 Hlavní fix — dovol načítat vše z dist/client
app.use(express.static(clientPath, { maxAge: "1y" }));

// ✅ všechno ostatní → Astro SSR
app.use(astroHandler);

// 🚀 Start
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
