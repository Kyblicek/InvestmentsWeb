import express from 'express';
import { handler as serve } from './dist/server/entry.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// 🧠 Loguj požadavky, ať víme co se děje
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 🪄 Servíruj statické soubory
app.use('/_astro', express.static(path.join(__dirname, 'dist/client/_astro')));
app.use('/assets', express.static(path.join(__dirname, 'dist/client/assets')));
app.use(express.static(path.join(__dirname, 'dist/client')));

// 🪄 Astro server
app.use(serve);

// Fallback pro neznámé routy (aby Astro vrátilo 404 místo crashnutí)
app.use((req, res) => {
  res.status(404).send('404: Not Found');
});

// 🚀 Spusť server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
