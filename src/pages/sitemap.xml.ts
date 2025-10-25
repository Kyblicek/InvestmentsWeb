import type { APIRoute } from 'astro';

type UrlItem = {
  loc: string;
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority?: number;
};

const SITE_URL = 'https://rrinvestments.eu';

async function getStaticRoutes(): Promise<UrlItem[]> {
  const now = new Date().toISOString().split('T')[0];
  return [
    { loc: '/', lastmod: now, changefreq: 'monthly', priority: 1.0 },
    { loc: '/posts', lastmod: now, changefreq: 'weekly', priority: 0.8 },
    { loc: '/portal', lastmod: now, changefreq: 'monthly', priority: 0.6 },
    { loc: '/partneri', lastmod: now, changefreq: 'monthly', priority: 0.6 },
    { loc: '/prihlaseni', lastmod: now, changefreq: 'monthly', priority: 0.4 },
  ];
}

async function getDynamicPostRoutes(): Promise<UrlItem[]> {
  try {
    const { db } = await import('../server/db');
    const posts = await db.post.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    return posts.map((post) => ({
      loc: `/posts/${post.id}`,
      lastmod: post.updatedAt.toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.6,
    }));
  } catch (error) {
    console.warn('⚠️ Dynamic sitemap generation failed:', error);
    return [];
  }
}

export const GET: APIRoute = async () => {
  const urls = [
    ...(await getStaticRoutes()),
    ...(await getDynamicPostRoutes()),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `
  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    ${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}
    ${typeof u.priority === 'number' ? `<priority>${u.priority.toFixed(1)}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`.trim();

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
};
