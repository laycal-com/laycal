import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Image from 'next/image';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import NewsletterSignup from '@/components/NewsletterSignup';
import BlogFilters from '@/components/BlogFilters';

export const metadata: Metadata = {
  title: "Laycal Blog - AI Voice Agent & Automated Calling System Insights | Sales Tips & Industry News",
  description: "Get the latest insights on AI voice agents, automated calling systems, sales strategies, and industry news. Learn how to increase sales efficiency with AI powered phone calls and appointment setters.",
  keywords: "ai voice agent blog, automated calling system blog, ai powered phone calls, sales tips, ai appointment setter, sales automation, cold calling tips, business phone systems, ai for sales",
  metadataBase: new URL("https://laycal.com"),
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Laycal Blog - AI Voice Agent & Sales Automation Insights",
    description: "Get the latest insights on AI voice agents, automated calling systems, sales strategies, and industry news. Learn how to increase sales efficiency with AI powered phone calls and appointment setters.",
    url: "https://laycal.com/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Laycal Blog - AI Voice Agent & Sales Automation Insights",
    description: "Get the latest insights on AI voice agents, automated calling systems, sales strategies, and industry news.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  author: string;
  category: string;
  publishedAt: string;
  image: string;
  featured: boolean;
  tags: string[];
  readTime: string;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  const blogsDirectory = path.join(process.cwd(), 'blogs');
  const filenames = fs.readdirSync(blogsDirectory);
  
  const posts = filenames
    .filter((name) => name.endsWith('.md'))
    .map((filename) => {
      const filePath = path.join(blogsDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);
      
      return {
        slug: filename.replace(/\.md$/, ''),
        ...data,
      } as BlogPost;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return posts;
}

export default async function BlogPage() {
  const posts = await getBlogPosts();
  const featuredPosts = posts.filter(post => post.featured);
  const regularPosts = posts.filter(post => !post.featured);
  const categories = [...new Set(posts.map(post => post.category))];

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white py-20 pt-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            The Laycal Blog
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
            Get tips and advice on delivering exceptional customer service, engaging and delighting your 
            customers, and building a customer-centric company.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-16">
        {/* Featured Posts Section */}
        {featuredPosts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Featured Blogs</h2>
              <div className="flex space-x-4">
                <button className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                  Latest Blogs
                </button>
                <button className="px-4 py-2 text-gray-600 bg-gray-50 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                  Featured Categories
                </button>
                <button className="px-4 py-2 text-gray-600 bg-gray-50 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                  All Categories
                </button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredPosts.slice(0, 3).map((post) => (
                <Link key={post.slug} href={`/blogs/${post.slug}`} className="group">
                  <article className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                    <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {post.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                        <span className="mx-2">•</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {post.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">By {post.author}</span>
                        <div className="flex space-x-2">
                          {post.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Blog Filters and Posts */}
        <BlogFilters posts={regularPosts} categories={categories} />

        {/* Load More Button */}
        <div className="text-center mb-16">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Load More
          </button>
        </div>
      </main>

      {/* Newsletter Signup */}
      <NewsletterSignup />

      <Footer />
    </div>
  );
}