// server.mjs
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { handler as ssrHandler } from "./dist/server/entry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const clientPath = path.resolve(__dirname, "dist/client");

console.log("📁 Serving static files from:", clientPath);

// 🔹 explicitní statické routy pro všechny možné bundly
app.use("/_astro", express.static(path.join(clientPath, "_astro")));
app.use("/assets", express.static(path.join(clientPath, "assets")));
app.use("/favicon_io", express.static(path.join(clientPath, "favicon_io")));
app.use("/public", express.static(path.join(clientPath)));
app.use(express.static(clientPath, { index: false }));

// 🔹 fallback SSR
app.use(ssrHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Astro 4 server running on http://localhost:${PORT}`);
});
