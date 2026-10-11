import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import TableOfContents from '@/components/TableOfContents';
import { DEMO_URL } from '@/lib/links';

interface BlogPost {
  title: string;
  description: string;
  author: string;
  category: string;
  publishedAt: string;
  image: string;
  featured: boolean;
  tags: string[];
  readTime: string;
  content: string;
}

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface Props {
  params: { slug: string };
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const filePath = path.join(process.cwd(), 'blogs', `${slug}.md`);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    
    return {
      ...data,
      content,
    } as BlogPost;
  } catch (error) {
    return null;
  }
}

function generateTableOfContents(content: string): TocItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    
    // Only include H2 headings (level 2) in table of contents
    if (level === 2) {
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      toc.push({
        id,
        title,
        level,
      });
    }
  }

  return toc;
}

async function getRelatedPosts(currentSlug: string, category: string): Promise<{ slug: string; title: string; image: string; readTime: string; publishedAt: string }[]> {
  const blogsDirectory = path.join(process.cwd(), 'blogs');
  if (!fs.existsSync(blogsDirectory)) return [];
  const filenames = fs.readdirSync(blogsDirectory);
  
  const posts = filenames
    .filter((name) => name.endsWith('.md') && name !== `${currentSlug}.md`)
    .map((filename) => {
      const filePath = path.join(blogsDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);
      
      return {
        slug: filename.replace(/\.md$/, ''),
        title: data.title,
        image: data.image,
        readTime: data.readTime,
        publishedAt: data.publishedAt,
        category: data.category,
      };
    })
    .filter((post) => post.category === category)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);

  return posts;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getBlogPost(resolvedParams.slug);
  
  if (!post) {
    return {
      title: 'Blog Post Not Found',
    };
  }

  return {
    title: { absolute: `${post.title} | Laycal Blog` },
    description: post.description,
    keywords: `${post.tags.join(', ')}, ai voice agent, automated calling system, sales automation`,
    alternates: {
      canonical: `/blogs/${resolvedParams.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://www.laycal.com/blogs/${resolvedParams.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.image],
    },
  };
}

// Custom components for MDX
const components = {
  // Markdown bodies start with `# title`, but the template already renders the
  // post title as the page's single H1 — so markdown H1s render as H2s.
  h1: ({ children }: any) => {
    const id = typeof children === 'string' ? children.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
    return (
      <h2 id={id} className="text-3xl font-semibold text-foreground mb-4 mt-8 scroll-mt-24">
        <a href={`#${id}`} className="group hover:text-brand-soft transition-colors">
          {children}
          <span className="ml-2 opacity-0 group-hover:opacity-100 text-brand-soft transition-opacity">#</span>
        </a>
      </h2>
    );
  },
  h2: ({ children }: any) => {
    const id = typeof children === 'string' ? children.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
    return (
      <h2 id={id} className="text-3xl font-semibold text-foreground mb-4 mt-8 scroll-mt-24">
        <a href={`#${id}`} className="group hover:text-brand-soft transition-colors">
          {children}
          <span className="ml-2 opacity-0 group-hover:opacity-100 text-brand-soft transition-opacity">#</span>
        </a>
      </h2>
    );
  },
  h3: ({ children }: any) => {
    const id = typeof children === 'string' ? children.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
    return (
      <h3 id={id} className="text-2xl font-semibold text-foreground mb-3 mt-6 scroll-mt-24">
        <a href={`#${id}`} className="group hover:text-brand-soft transition-colors">
          {children}
          <span className="ml-2 opacity-0 group-hover:opacity-100 text-brand-soft transition-opacity">#</span>
        </a>
      </h3>
    );
  },
  p: ({ children }: any) => {
    // Check if paragraph contains only an image or iframe
    try {
      if (React.Children.count(children) === 1) {
        const child = React.Children.toArray(children)[0];
        if (React.isValidElement(child) && (child.type === 'img' || child.type === 'iframe')) {
          // Render image/iframe without paragraph wrapper
          return child;
        }
      }
    } catch (error) {
      // If there's any error, fall back to normal paragraph rendering
      console.log('Error in paragraph handling:', error);
    }
    
    return (
      <p className="text-lg text-muted-foreground leading-relaxed mb-4">{children}</p>
    );
  },
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside text-lg text-muted-foreground mb-4 space-y-2">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside text-lg text-muted-foreground mb-4 space-y-2">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="mb-1">{children}</li>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-primary pl-6 py-2 mb-6 bg-primary/10 rounded-r-lg">
      <div className="text-lg text-muted-foreground italic">{children}</div>
    </blockquote>
  ),
  code: ({ children }: any) => (
    <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-brand-soft">{children}</code>
  ),
  pre: ({ children }: any) => (
    <pre className="bg-card text-muted-foreground p-4 rounded-lg mb-6 overflow-x-auto">
      <code>{children}</code>
    </pre>
  ),
  // Images - now safely using figure since paragraph wrapper is handled
  img: ({ src, alt, ...props }: any) => {
    return (
      <figure className="my-8 max-w-2xl mx-auto">
        <Image
          src={src}
          alt={alt || ''}
          width={800}
          height={400}
          className="rounded-lg shadow-lg w-full object-cover"
          {...props}
        />
      </figure>
    );
  },
  // Links - ensure they're styled in blue
  a: ({ href, children, ...props }: any) => (
    <a 
      href={href} 
      className="text-brand-soft hover:text-brand-soft underline transition-colors font-medium"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  // Videos/iframes - using figure elements 
  iframe: ({ src, title, width = "560", height = "315", ...props }: any) => {
    // Extract YouTube video ID if it's a YouTube URL
    const youtubeMatch = src?.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    const videoId = youtubeMatch?.[1];
    
    if (videoId) {
      return (
        <figure className="my-8 max-w-2xl mx-auto">
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden shadow-lg">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              title={title || 'YouTube Video'}
              width="100%"
              height="100%"
              className="absolute inset-0"
              frameBorder={0}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          {title && (
            <figcaption className="text-center text-sm text-muted-foreground mt-2 italic">{title}</figcaption>
          )}
        </figure>
      );
    }
    
    // Fallback for other iframes
    return (
      <figure className="my-8 max-w-2xl mx-auto">
        <div className="relative aspect-video">
          <iframe
            src={src}
            title={title}
            width="100%"
            height="100%"
            className="rounded-lg shadow-lg absolute inset-0"
            frameBorder={0}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            {...props}
          />
        </div>
      </figure>
    );
  },
};

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const post = await getBlogPost(resolvedParams.slug);
  
  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(resolvedParams.slug, post.category);
  const tableOfContents = generateTableOfContents(post.content);

  return (
    <div className="min-h-screen bg-card">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.description,
            image: post.image.startsWith('http') ? post.image : `https://www.laycal.com${post.image}`,
            datePublished: post.publishedAt,
            author: { '@type': 'Organization', name: post.author || 'Laycal' },
            publisher: {
              '@type': 'Organization',
              name: 'Laycal',
              url: 'https://www.laycal.com',
              logo: { '@type': 'ImageObject', url: 'https://www.laycal.com/assets/logo.png' },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://www.laycal.com/blogs/${resolvedParams.slug}`,
            },
          }),
        }}
      />
      <PublicNavbar />
      
      {/* Hero Section with Background Image */}
      <article className="pt-20">
        {/* Hero Section */}
        <header className="relative h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          
          {/* Hero Content */}
          <div className="relative z-10 h-full flex flex-col justify-center">
            <div className="max-w-4xl mx-auto px-4 text-white">
              <div className="mb-6">
                <Link 
                  href="/blogs" 
                  className="inline-flex items-center text-white/90 hover:text-white font-medium bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm transition-colors"
                >
                  ← Back to Blog
                </Link>
              </div>
              
              <div className="mb-6">
                <span className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                  {post.category}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-6 leading-tight text-white drop-shadow-lg">
                {post.title}
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 leading-relaxed text-white/95 max-w-3xl drop-shadow-md">
                {post.description}
              </p>
              
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-semibold text-lg">
                      {post.author.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">By {post.author}</p>
                    <div className="flex items-center text-sm text-white/90">
                      <time>{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</time>
                      <span className="mx-2">•</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="bg-card text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Table of Contents - Desktop Sidebar */}
            {tableOfContents.length > 0 && (
              <TableOfContents items={tableOfContents} />
            )}

            {/* Main Content */}
            <div className={tableOfContents.length > 0 ? "lg:col-span-3" : "lg:col-span-4"}>
              {/* Mobile TOC - Collapsible */}
              {tableOfContents.length > 0 && (
                <TableOfContents items={tableOfContents} isMobile={true} />
              )}

              <div className="prose prose-lg max-w-none">
                <MDXRemote 
                  source={post.content} 
                  components={components}
                  options={{
                    mdxOptions: {
                      remarkPlugins: [],
                      rehypePlugins: [],
                      format: 'mdx'
                    }
                  }}
                />
              </div>
              
              {/* Tags */}
              <div className="mt-12 pt-8 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="bg-primary/10 text-brand-soft px-3 py-1 rounded-full text-sm hover:bg-primary/15 cursor-pointer transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Product CTA: route readers from editorial content to the demo and the comparison hub */}
      <section className="bg-primary/5 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold text-foreground mb-4">
            Be the first call every lead gets
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Laycal calls every new lead within a minute, qualifies them and books the meeting on
            your calendar. Book a demo and hear a real call.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href={DEMO_URL}
              className="inline-block bg-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors"
            >
              Book a demo
            </Link>
            <Link
              href="/compare"
              className="inline-block border border-border text-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-muted transition-colors"
            >
              Compare Laycal
            </Link>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-muted/40 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-semibold text-foreground mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.slug} href={`/blogs/${relatedPost.slug}`} className="group">
                  <article className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="relative h-48">
                      <Image
                        src={relatedPost.image}
                        alt={relatedPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6">
                      <div className="text-sm text-muted-foreground mb-2">
                        <time>{new Date(relatedPost.publishedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</time>
                        <span className="mx-2">•</span>
                        <span>{relatedPost.readTime}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-brand-soft transition-colors line-clamp-2">
                        {relatedPost.title}
                      </h3>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Email Collection Popup */}

      <Footer />
    </div>
  );
}