export const dynamic = 'force-static';

export async function GET() {
    const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
        'http://localhost:3000';

    const routes = [
        '/',
        '/place',
        '/place/new',
        '/place/map',
        '/mypage',
        '/signin',
        '/admin',
        '/admin/login',
        '/admin-basic/login'
    ];

    const urls = routes
        .map((path) => {
            return `  <url>\n    <loc>${siteUrl.replace(/\/$/, '')}${path}</loc>\n  </url>`;
        })
        .join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=0, s-maxage=86400'
        }
    });
}
