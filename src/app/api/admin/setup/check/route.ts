import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Admin from '@/models/Admin';

export async function GET() {
  try {
    await connectToDatabase();
    
    const adminCount = await Admin.countDocuments({});
    const setupRequired = adminCount === 0;

    return NextResponse.json({
      setupRequired
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Setup check failed' },
      { status: 500 }
    );
  }
}