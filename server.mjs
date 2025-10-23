import express from "express";
import { handler as astroHandler } from "./web/dist/server/entry.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// ✅ správné cesty, protože Railway má /app/web
const clientDist = path.join(__dirname, "web", "dist", "client");

app.use(express.static(clientDist));
app.use("/_astro", express.static(path.join(clientDist, "_astro")));
app.use("/assets", express.static(path.join(clientDist, "assets")));
app.use("/favicon_io", express.static(path.join(clientDist, "favicon_io")));

// 🔥 předej vše ostatní Astreu
app.use((req, res, next) => {
  astroHandler(req, res, next);
});

// ✅ start
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
