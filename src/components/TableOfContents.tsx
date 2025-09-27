'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
  isMobile?: boolean;
}

export default function TableOfContents({ items, isMobile = false }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first heading that's in view
        const visibleEntry = entries.find(entry => entry.isIntersecting);
        if (visibleEntry) {
          setActiveId(visibleEntry.target.id);
        }
      },
      {
        // Trigger when the heading is 20% visible from the top
        rootMargin: '-20% 0% -80% 0%',
        threshold: 0
      }
    );

    // Observe all H2 headings
    const headings = document.querySelectorAll('h2[id]');
    headings.forEach(heading => observer.observe(heading));

    return () => {
      headings.forEach(heading => observer.unobserve(heading));
    };
  }, []);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  if (isMobile) {
    return (
      <div className="lg:hidden mb-8">
        <details className="bg-gray-50 rounded-xl border border-gray-200">
          <summary className="p-4 cursor-pointer font-semibold text-gray-900 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Table of Contents
          </summary>
          <nav className="px-4 pb-4">
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleClick(item.id)}
                    className={`block text-sm hover:text-blue-600 transition-all duration-200 py-2 px-2 text-left w-full rounded-md ${
                      activeId === item.id 
                        ? 'text-blue-600 font-semibold bg-blue-50 border-l-4 border-blue-600 shadow-sm' 
                        : item.level === 1 ? 'font-semibold text-gray-900 hover:bg-gray-100' :
                        item.level === 2 ? 'text-gray-700 pl-4 hover:bg-gray-100' :
                        item.level === 3 ? 'text-gray-600 pl-8 hover:bg-gray-100' :
                        'text-gray-500 pl-12 hover:bg-gray-100'
                    }`}
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>
    );
  }

  return (
    <div className="lg:col-span-1">
      <div className="lg:sticky lg:top-24">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Table of Contents
          </h3>
          <nav>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleClick(item.id)}
                    className={`block text-sm hover:text-blue-600 transition-all duration-200 py-2 px-2 text-left w-full rounded-md ${
                      activeId === item.id 
                        ? 'text-blue-600 font-semibold bg-blue-50 border-l-4 border-blue-600 shadow-sm' 
                        : item.level === 1 ? 'font-semibold text-gray-900 hover:bg-gray-100' :
                        item.level === 2 ? 'text-gray-700 pl-4 hover:bg-gray-100' :
                        item.level === 3 ? 'text-gray-600 pl-8 hover:bg-gray-100' :
                        'text-gray-500 pl-12 hover:bg-gray-100'
                    }`}
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}