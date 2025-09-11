import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME_EXPORT as COOKIE_NAME } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  
  // Clear the admin token cookie
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0 // Expire immediately
  });

  return response;
}