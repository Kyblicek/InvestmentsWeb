// server.mjs
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { handler as ssrHandler } from "./dist/server/entry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ✅ Debug log až TEĎ — po vytvoření app
app.use((req, res, next) => {
  console.log("👉 Request:", req.url);
  next();
});

const clientPath = path.resolve(__dirname, "dist/client");
console.log("📁 Serving static files from:", clientPath);

// ✅ Nejprve statika (Astro 4)
app.use(express.static(clientPath));
app.use("/assets", express.static(path.join(clientPath, "assets")));

// ✅ Pak SSR handler
app.use(ssrHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Astro 4 server running on http://localhost:${PORT}`);
});
