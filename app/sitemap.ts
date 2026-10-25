import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://www.simpul-brmpph.id/',
            changeFrequency: 'weekly',
            priority: 1,
        },
    ]
}