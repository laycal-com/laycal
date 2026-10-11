import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Base URL for the site
const baseUrl = 'https://www.laycal.com';

// Static routes with their priorities and change frequencies.
// lastmod is the date the page's content last changed (from git history):
// bump it when the content actually changes, not on every deploy.
const staticRoutes = [
  // Public pages (high priority)
  { url: '', priority: 1.0, changeFrequency: 'daily' as const, lastModified: '2026-10-11' },
  { url: '/speed-to-lead', priority: 0.9, changeFrequency: 'monthly' as const, lastModified: '2026-10-11' },
  { url: '/instant-lead-follow-up', priority: 0.9, changeFrequency: 'monthly' as const, lastModified: '2026-10-11' },
  { url: '/lead-reactivation', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: '2026-10-10' },
  { url: '/blogs', priority: 0.7, changeFrequency: 'weekly' as const, lastModified: '2026-10-11' },
  { url: '/contact', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: '2026-10-10' },

  // Alternative/comparison pages
  { url: '/compare', priority: 0.8, changeFrequency: 'weekly' as const, lastModified: '2026-10-11' },
  { url: '/justcall-alternative', priority: 0.8, changeFrequency: 'weekly' as const, lastModified: '2026-10-11' },
  { url: '/nooks-alternative', priority: 0.8, changeFrequency: 'weekly' as const, lastModified: '2026-10-11' },

  // Legal pages
  { url: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const, lastModified: '2026-10-09' },
  { url: '/terms', priority: 0.3, changeFrequency: 'yearly' as const, lastModified: '2026-10-09' },
];

// Get all blog posts. Fails loud (empty list + error log) rather than serving
// a stale hardcoded set.
async function getBlogPosts() {
  try {
    const blogsDirectory = path.join(process.cwd(), 'blogs');

    if (!fs.existsSync(blogsDirectory)) {
      throw new Error(`Blogs directory not found at: ${blogsDirectory}`);
    }

    const filenames = fs.readdirSync(blogsDirectory);

    const posts = filenames
      .filter((name) => name.endsWith('.md'))
      .map((filename) => {
        const filePath = path.join(blogsDirectory, filename);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContents);
        const stats = fs.statSync(filePath);

        // Ensure we have a valid date for lastModified
        let lastModified: Date;
        try {
          // Try to use publishedAt if available and valid
          lastModified = data.publishedAt ? new Date(data.publishedAt) : stats.mtime;
          // Validate the date
          if (isNaN(lastModified.getTime())) {
            lastModified = stats.mtime;
          }
        } catch {
          lastModified = stats.mtime;
        }

        return {
          slug: filename.replace(/\.md$/, ''),
          publishedAt: data.publishedAt || stats.mtime.toISOString().split('T')[0],
          lastModified,
          featured: data.featured || false,
        };
      })
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return posts;
  } catch (error) {
    console.error('Error reading blog posts for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await getBlogPosts();

  const staticSitemapEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: new URL(route.url, baseUrl).toString(),
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Blog post routes with proper URL encoding and date formatting
  const blogSitemapEntries: MetadataRoute.Sitemap = blogPosts.map((post) => {
    // Ensure proper URL encoding for blog slugs
    const encodedSlug = encodeURIComponent(post.slug);
    const postUrl = new URL(`/blogs/${encodedSlug}`, baseUrl).toString();

    return {
      url: postUrl,
      lastModified: post.lastModified.toISOString(),
      changeFrequency: 'monthly' as const,
      priority: post.featured ? 0.8 : 0.6,
    };
  });

  // Combine all routes and validate URLs
  const allEntries = [
    ...staticSitemapEntries,
    ...blogSitemapEntries,
  ];

  // Filter out any invalid URLs
  const validEntries = allEntries.filter(entry => {
    try {
      new URL(entry.url);
      return true;
    } catch {
      console.warn(`Invalid URL in sitemap: ${entry.url}`);
      return false;
    }
  });

  return validEntries;
}

export const revalidate = 3600;

// Add explicit content type for better compatibility
export const contentType = 'application/xml';
