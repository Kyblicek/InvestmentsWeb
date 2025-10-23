import express from "express";
import { handler as astroHandler } from "./dist/server/entry.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// 💡 servíruj statické buildy (CSS, JS, obrázky)
app.use("/_astro", express.static(path.join(__dirname, "dist/client/_astro")));
app.use("/assets", express.static(path.join(__dirname, "dist/client/assets")));
app.use(express.static(path.join(__dirname, "dist/client")));

// 🔥 vše ostatní předej Astreu
app.all("*", astroHandler);

// ✅ start
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅  Server running on port ${PORT}`);
});
