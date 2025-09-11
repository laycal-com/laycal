import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const admin = await AdminAuthService.createFirstAdmin(email, password, name);
    
    // Initialize default settings
    await AdminAuthService.initializeDefaultSettings();

    logger.info('ADMIN_SETUP_COMPLETE', 'First admin account created', {
      adminId: admin._id.toString(),
      email: admin.email,
      name: admin.name
    });

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully'
    });

  } catch (error) {
    logger.error('ADMIN_SETUP_ERROR', 'Failed to create first admin', { error });
    
    if (error instanceof Error && error.message === 'Admin already exists') {
      return NextResponse.json(
        { error: 'Setup has already been completed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Setup failed' },
      { status: 500 }
    );
  }
}