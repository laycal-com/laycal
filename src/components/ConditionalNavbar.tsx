'use client';

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Public pages that should use the blue navbar (built into each page)
  const publicPages = ['/', '/contact', '/privacy', '/status', '/terms'];
  
  // Don't show white navbar on admin paths or public pages
  // Auth pages bring their own frame.
  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

  if (pathname.startsWith('/admin') || isAuthPage || publicPages.includes(pathname)) {
    return null;
  }
  
  return <Navbar />;
}