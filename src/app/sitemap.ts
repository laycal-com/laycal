import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Base URL for the site
const baseUrl = 'https://www.laycal.com';

// Static routes with their priorities and change frequencies
const staticRoutes = [
  // Public pages (high priority)
  { url: '', priority: 1.0, changeFrequency: 'daily' as const },
  { url: '/pricing', priority: 0.9, changeFrequency: 'weekly' as const },
  { url: '/features', priority: 0.9, changeFrequency: 'weekly' as const },
  { url: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/contact', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/blogs', priority: 0.9, changeFrequency: 'daily' as const },
  
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
  // First try the file system approach
  try {
    const blogsDirectory = path.join(process.cwd(), 'blogs');
    
    // Debug: Log the directory path being used
    console.log('Blogs directory path:', blogsDirectory);
    console.log('Current working directory:', process.cwd());
    
    // Check if blogs directory exists
    if (!fs.existsSync(blogsDirectory)) {
      console.warn('Blogs directory not found at:', blogsDirectory);
      throw new Error('Blogs directory not found');
    }
    
    const filenames = fs.readdirSync(blogsDirectory);
    console.log('Found blog files:', filenames.length, filenames);
    
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
    
    // Fallback: Return known blog posts if file reading fails in production
    const fallbackPosts = [
      {
        slug: 'justcall-alternatives-2026',
        publishedAt: '2025-09-27',
        lastModified: new Date('2025-09-27'),
        featured: true,
      },
      {
        slug: 'nooks-alternative-2026',
        publishedAt: '2025-01-20',
        lastModified: new Date('2025-01-20'),
        featured: true,
      },
      {
        slug: 'aloware-alternative-2026',
        publishedAt: '2025-01-22',
        lastModified: new Date('2025-01-22'),
        featured: true,
      },
      {
        slug: 'kixie-alternative-2026',
        publishedAt: '2025-01-24',
        lastModified: new Date('2025-01-24'),
        featured: true,
      },
      {
        slug: 'dialpad-alternative-2026',
        publishedAt: '2025-01-26',
        lastModified: new Date('2025-01-26'),
        featured: true,
      },
      {
        slug: 'ringover-alternative-2026',
        publishedAt: '2025-01-28',
        lastModified: new Date('2025-01-28'),
        featured: true,
      },
    ];
    
    console.log('Using fallback blog posts:', fallbackPosts.length);
    return fallbackPosts;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await getBlogPosts();
  const currentDate = new Date();
  
  // Static routes with proper URL encoding and date formatting
  const staticSitemapEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: new URL(route.url, baseUrl).toString(),
    lastModified: currentDate.toISOString(),
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

// Configure revalidation (cache for 5 minutes for debugging) and add metadata
export const revalidate = 300;

// Add explicit content type for better compatibility
export const contentType = 'application/xml';