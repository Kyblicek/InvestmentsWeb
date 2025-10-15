// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

const site = process.env.PUBLIC_SITE_URL || 'https://example.com';

// https://astro.build/config
export default defineConfig({
  site,
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [sitemap()],
});
