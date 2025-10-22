import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api',
    'Disallow: /drafts',
    'Sitemap: https://rrinvestments.eu/sitemap.xml',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
