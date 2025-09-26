'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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

interface BlogFiltersProps {
  posts: BlogPost[];
  categories: string[];
}

export default function BlogFilters({ posts, categories }: BlogFiltersProps) {
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [filteredPosts, setFilteredPosts] = useState(posts);

  const handleCategoryFilter = (category: string) => {
    setActiveCategory(category);
    if (category === 'All Categories') {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter(post => post.category === category));
    }
  };

  return (
    <div>
      {/* Categories Filter */}
      <section className="mb-12">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => handleCategoryFilter('All Categories')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeCategory === 'All Categories' 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button 
              key={category}
              onClick={() => handleCategoryFilter(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Filtered Posts Grid */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <Link key={post.slug} href={`/blogs/${post.slug}`} className="group">
              <article className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
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
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
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
        
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No posts found in this category.</p>
          </div>
        )}
      </section>
    </div>
  );
}