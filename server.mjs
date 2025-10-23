import express from "express";
import { handler as astroHandler } from "./dist/server/entry.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 👉 servíruj všechny buildnuté CSS, obrázky a favicony
app.use(express.static(path.join(__dirname, "dist", "client"), {
  maxAge: "1y",
  index: false,
}));

// 👉 fallback pro Astro (SSR)
app.use(astroHandler);

// ✅ start
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
