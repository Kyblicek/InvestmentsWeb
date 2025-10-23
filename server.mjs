import express from "express";
import { handler as astroHandler } from "./dist/server/entry.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// 🪄 FIX: railway spouští z /app, proto použij absolutní cestu k dist/client
const clientPath = path.resolve("./dist/client");

// 💡 statické složky
app.use("/_astro", express.static(path.join(clientPath, "_astro"), { maxAge: "1y" }));
app.use("/assets", express.static(path.join(clientPath, "assets"), { maxAge: "1y" }));
app.use("/favicon_io", express.static(path.join(clientPath, "favicon_io"), { maxAge: "1y" }));

// 💡 fallback pro rootové css a favicon.ico
app.get(["/*.css", "/favicon.ico"], (req, res, next) => {
  res.sendFile(path.join(clientPath, req.path), (err) => {
    if (err) next();
  });
});

// 💡 všechno ostatní → Astro SSR
app.use(astroHandler);

// ✅ start
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
