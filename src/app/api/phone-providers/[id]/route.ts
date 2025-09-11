import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import PhoneProvider from '@/models/PhoneProvider';

// GET - Get a specific phone provider
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const provider = await PhoneProvider.findOne({
      _id: params.id,
      userId
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      provider: {
        id: provider._id,
        providerName: provider.providerName,
        displayName: provider.displayName,
        phoneNumber: provider.phoneNumber,
        credentials: provider.credentials, // Include credentials for editing
        isActive: provider.isActive,
        isDefault: provider.isDefault,
        lastTestedAt: provider.lastTestedAt,
        testStatus: provider.testStatus,
        testMessage: provider.testMessage,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt
      }
    });

  } catch (error) {
    console.error('Failed to fetch phone provider:', error);
    return NextResponse.json({
      error: 'Failed to fetch phone provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update a phone provider
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      displayName,
      phoneNumber,
      credentials,
      isActive,
      isDefault
    } = body;

    await connectToDatabase();

    const provider = await PhoneProvider.findOne({
      _id: params.id,
      userId
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Update fields
    if (displayName !== undefined) provider.displayName = displayName;
    if (phoneNumber !== undefined) provider.phoneNumber = phoneNumber;
    if (credentials !== undefined) provider.credentials = credentials;
    if (isActive !== undefined) provider.isActive = isActive;
    if (isDefault !== undefined) provider.isDefault = isDefault;

    await provider.save();

    return NextResponse.json({
      success: true,
      message: 'Phone provider updated successfully',
      provider: {
        id: provider._id,
        providerName: provider.providerName,
        displayName: provider.displayName,
        phoneNumber: provider.phoneNumber,
        isActive: provider.isActive,
        isDefault: provider.isDefault,
        updatedAt: provider.updatedAt
      }
    });

  } catch (error) {
    console.error('Failed to update phone provider:', error);
    return NextResponse.json({
      error: 'Failed to update phone provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete a phone provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const provider = await PhoneProvider.findOne({
      _id: params.id,
      userId
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Don't allow deleting the default provider if it's the only one
    if (provider.isDefault) {
      const totalProviders = await PhoneProvider.countDocuments({ userId });
      if (totalProviders === 1) {
        return NextResponse.json({
          error: 'Cannot delete the only phone provider',
          details: 'Add another provider first, then delete this one'
        }, { status: 400 });
      }
    }

    await PhoneProvider.deleteOne({ _id: params.id });

    // If we deleted the default provider, make another one default
    if (provider.isDefault) {
      const nextProvider = await PhoneProvider.findOne({ userId });
      if (nextProvider) {
        nextProvider.isDefault = true;
        await nextProvider.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Phone provider deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete phone provider:', error);
    return NextResponse.json({
      error: 'Failed to delete phone provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}