import { handler as serve } from './dist/server/entry.mjs';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// 💡 Tohle přidá obsluhu statických souborů
app.use(express.static(path.join(__dirname, 'dist/client')));

// Astro server
app.use(serve);

// Railway používá PORT z env proměnné
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
