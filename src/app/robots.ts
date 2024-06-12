import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/private/*',
                    '/api/*',
                ],
            },
        ],
        sitemap: 'https://www.bit10.app/sitemap.xml',
    }
}