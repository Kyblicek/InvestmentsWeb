import type { APIRoute } from 'astro';

type UrlItem = {
  loc: string;
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority?: number;
};

async function getStaticRoutes(): Promise<UrlItem[]> {
  const now = new Date().toISOString().slice(0, 10);
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
      lastmod: post.updatedAt.toISOString().slice(0, 10),
      changefreq: 'weekly',
      priority: 0.6,
    }));
  } catch (error) {
    console.warn('Failed to load dynamic sitemap routes', error);
    return [];
  }
}

export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('https://rrinvestments.eu')).toString().replace(/\/+$/, '') + '/';
  const urls: UrlItem[] = [
    ...(await getStaticRoutes()),
    ...(await getDynamicPostRoutes()),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => {
      const loc = new URL(u.loc.replace(/^\//, ''), base).toString();
      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : '',
        u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>` : '',
        typeof u.priority === 'number' ? `    <priority>${u.priority.toFixed(1)}</priority>` : '',
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
