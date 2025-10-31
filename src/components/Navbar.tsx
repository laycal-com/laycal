"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  // Check for unread support messages
  useEffect(() => {
    const checkUnreadMessages = async () => {
      try {
        // Get last checked time from localStorage
        const lastChecked = localStorage.getItem('support-last-checked') || 
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Default to 24h ago
        
        const response = await fetch(`/api/support/unread?lastChecked=${encodeURIComponent(lastChecked)}`);
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Failed to check unread messages:', error);
      }
    };

    checkUnreadMessages();
    
    // Check every 5 minutes for new messages
    const interval = setInterval(checkUnreadMessages, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Mark messages as read when user visits support page
  useEffect(() => {
    if (pathname === '/support' && unreadCount > 0) {
      // Update last checked time
      localStorage.setItem('support-last-checked', new Date().toISOString());
      setUnreadCount(0);
      
      // Optionally call the API to update server-side tracking
      fetch('/api/support/unread', { method: 'POST' }).catch(console.error);
    }
  }, [pathname, unreadCount]);

  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Leads", href: "/leads" },
    { name: "Assistants", href: "/assistants" },
    { name: "Appointments", href: "/appointments" },
    { name: "Integrations", href: "/integrations" },
    { name: "Settings", href: "/settings" },
    { name: "Support", href: "/support" },
  ];

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.3)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1rem 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link href="/" style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none'
            }}>
              <Image 
                src="/assets/logo.png" 
                alt="Laycal"
                width={100}
                height={30}
                className="h-8 w-auto"
                priority
              />
            </Link>
            <SignedIn>
              <nav style={{ display: 'flex', gap: '2rem' }}>
                {navigation.map((item) => (
                  <div key={item.name} style={{ position: 'relative' }}>
                    <Link
                      href={item.href}
                      style={{
                        color: pathname === item.href ? '#1e40af' : '#64748b',
                        fontWeight: pathname === item.href ? '600' : '500',
                        textDecoration: 'none',
                        transition: 'color 0.2s ease',
                        fontSize: '0.875rem'
                      }}
                      onMouseEnter={(e) => {
                        if (pathname !== item.href) {
                          e.target.style.color = '#3b82f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pathname !== item.href) {
                          e.target.style.color = '#64748b';
                        }
                      }}
                    >
                      {item.name}
                    </Link>
                    {/* Notification Badge for Support */}
                    {item.name === 'Support' && unreadCount > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </SignedIn>
          </div>
          <div>
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton>
                <button style={{
                  background: '#3b82f6',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                  e.target.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.backgroundColor = '#3b82f6';
                }}
                >
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </div>
  );
}