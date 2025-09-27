import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export async function GET() {
  try {
    // Get blog posts info for debugging
    const blogsDirectory = path.join(process.cwd(), 'blogs');
    
    // Check directory existence
    const dirExists = fs.existsSync(blogsDirectory);
    if (!dirExists) {
      return NextResponse.json({
        success: false,
        error: 'Blogs directory not found',
        blogsDirectory,
        cwd: process.cwd(),
        env: process.env.NODE_ENV,
      });
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
          filename,
          slug: filename.replace(/\.md$/, ''),
          publishedAt: data.publishedAt,
          title: data.title,
          lastModified: stats.mtime.toISOString(),
          featured: data.featured || false,
        };
      });

    return NextResponse.json({
      success: true,
      baseUrl: 'https://laycal.com',
      totalPosts: posts.length,
      posts,
      sitemapUrl: 'https://laycal.com/sitemap.xml',
      robotsUrl: 'https://laycal.com/robots.txt',
      timestamp: new Date().toISOString(),
      blogsDirectory,
      cwd: process.cwd(),
      env: process.env.NODE_ENV,
      filenames: filenames.filter(name => name.endsWith('.md')),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}