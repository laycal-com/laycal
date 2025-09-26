import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Base URL for the site
const baseUrl = 'https://laycal.com';

// Static routes with their priorities and change frequencies
const staticRoutes = [
  // Public pages (high priority)
  { url: '', priority: 1.0, changeFrequency: 'daily' as const },
  { url: '/pricing', priority: 0.9, changeFrequency: 'weekly' as const },
  { url: '/features', priority: 0.9, changeFrequency: 'weekly' as const },
  { url: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/contact', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/blog', priority: 0.9, changeFrequency: 'daily' as const },
  
  // Alternative/comparison pages
  { url: '/justcall-alternative', priority: 0.8, changeFrequency: 'weekly' as const },
  { url: '/nooks-alternative', priority: 0.8, changeFrequency: 'weekly' as const },
  { url: '/case-studies', priority: 0.7, changeFrequency: 'monthly' as const },
  { url: '/sdr', priority: 0.7, changeFrequency: 'monthly' as const },
  
  // Legal pages
  { url: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  { url: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
  { url: '/support', priority: 0.6, changeFrequency: 'monthly' as const },
  { url: '/status', priority: 0.6, changeFrequency: 'daily' as const },
];

// Get all blog posts
async function getBlogPosts() {
  try {
    const blogsDirectory = path.join(process.cwd(), 'blogs');
    
    // Check if blogs directory exists
    if (!fs.existsSync(blogsDirectory)) {
      return [];
    }
    
    const filenames = fs.readdirSync(blogsDirectory);
    
    const posts = filenames
      .filter((name) => name.endsWith('.md'))
      .map((filename) => {
        const filePath = path.join(blogsDirectory, filename);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContents);
        const stats = fs.statSync(filePath);
        
        return {
          slug: filename.replace(/\.md$/, ''),
          publishedAt: data.publishedAt || stats.mtime.toISOString().split('T')[0],
          lastModified: stats.mtime,
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
  
  // Static routes
  const staticSitemapEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Blog post routes
  const blogSitemapEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blogs/${post.slug}`,
    lastModified: post.lastModified,
    changeFrequency: 'monthly' as const,
    priority: post.featured ? 0.8 : 0.6, // Higher priority for featured posts
  }));

  // Combine all routes
  return [
    ...staticSitemapEntries,
    ...blogSitemapEntries,
  ];
}

// Optional: Configure revalidation (cache for 1 hour)
export const revalidate = 3600;