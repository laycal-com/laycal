'use client';

import React from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';

export default function PublicNavbar() {
  return (
    <nav className="fixed top-0 w-full bg-[#1e40af] z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image 
                src="/assets/logo.png" 
                alt="Laycal"
                width={100}
                height={30}
                className="h-8 w-auto filter brightness-0 invert"
                priority
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#features" className="text-white hover:text-gray-200 transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="text-white hover:text-gray-200 transition-colors">
              Pricing
            </Link>
            <Link href="/#how-it-works" className="text-white hover:text-gray-200 transition-colors">
              How It Works
            </Link>
            <Link href="/contact" className="text-white hover:text-gray-200 transition-colors">
              Contact
            </Link>
          </div>

          {/* CTA Button */}
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton>
                <button className="text-white hover:text-gray-200 transition-colors">
                  Login
                </button>
              </SignInButton>
              <SignInButton>
                <button className="bg-[#3b82f6] text-white px-6 py-2 rounded-lg hover:bg-[#2563eb] transition-colors font-semibold">
                  Sign Up
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <button className="bg-[#3b82f6] text-white px-6 py-2 rounded-lg hover:bg-[#2563eb] transition-colors font-semibold">
                  Go to Dashboard
                </button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}