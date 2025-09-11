import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService, COOKIE_NAME_EXPORT as COOKIE_NAME } from '@/lib/adminAuth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await AdminAuthService.authenticate(email, password);

    if (!result) {
      logger.warn('ADMIN_LOGIN_FAILED', 'Failed admin login attempt', {
        email: email.toLowerCase(),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const { admin, token } = result;

    logger.info('ADMIN_LOGIN_SUCCESS', 'Admin logged in successfully', {
      adminId: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      admin: {
        _id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.getAllPermissions()
      }
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    logger.error('ADMIN_LOGIN_ERROR', 'Admin login error', { error });
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}