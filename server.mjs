import express from "express";
import { handler as astroHandler } from "./dist/server/entry.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// ✅ statické složky
const clientDist = path.join(__dirname, "dist", "client");
app.use(express.static(clientDist));
app.use("/_astro", express.static(path.join(clientDist, "_astro")));
app.use("/assets", express.static(path.join(clientDist, "assets")));
app.use("/favicon_io", express.static(path.join(clientDist, "favicon_io")));

// 🔥 Astro handler pro zbytek
app.use((req, res, next) => {
  astroHandler(req, res, next);
});

// ✅ start
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
