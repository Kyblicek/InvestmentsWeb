// @ts-check
// @ts-ignore -- Astro provides ESM types via package exports
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://rrinvestments.eu',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [sitemap()],
});
