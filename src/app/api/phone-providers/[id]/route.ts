import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import PhoneProvider from '@/models/PhoneProvider';
import Assistant from '@/models/Assistant';
import { TenantVapiService } from '@/lib/tenantVapi';
import { logger } from '@/lib/logger';

// GET - Get a specific phone provider
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { accountId } = await getAccountAuth();

    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const provider = await PhoneProvider.findOne({
      _id: id,
      accountId
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { accountId } = await getAccountAuth();

    if (!accountId) {
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
      _id: id,
      accountId
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { accountId } = await getAccountAuth();

    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const provider = await PhoneProvider.findOne({
      _id: id,
      accountId
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Deleting the last provider used to be blocked. It shouldn't be: an
    // account with no custom provider is a supported state — US calls fall
    // through to the shared default number in getPhoneProviderOrDefault. The
    // guard only ever trapped people who wanted to remove bad credentials.

    // Release the number on Vapi first. Never fatal: leaving a stale
    // registration behind is far better than a provider you can't delete
    // because Vapi is down.
    // null = there was nothing registered to release, which is not a failure.
    let vapiNumberReleased: boolean | null = null;
    if (provider.vapiPhoneNumberId) {
      try {
        const vapi = new TenantVapiService();
        vapiNumberReleased = await vapi.deletePhoneNumber(provider.vapiPhoneNumberId);
      } catch (releaseError) {
        logger.warn('PHONE_PROVIDER_VAPI_RELEASE_FAILED', 'Could not release Vapi number on delete', {
          accountId,
          data: {
            providerId: id,
            vapiPhoneNumberId: provider.vapiPhoneNumberId,
            error: releaseError instanceof Error ? releaseError.message : String(releaseError),
          },
        });
      }
    }

    await PhoneProvider.deleteOne({ _id: id });

    // Drop the dangling reference from any assistant pinned to this provider,
    // so those assistants fall back to the default number instead of carrying
    // an ObjectId that resolves to nothing at call time.
    const detached = await Assistant.updateMany(
      { accountId, 'phoneNumbers.phoneProviderId': id },
      { $pull: { phoneNumbers: { phoneProviderId: id } } }
    );

    // Promote another provider so the account still has a default to use.
    let promoted: string | null = null;
    if (provider.isDefault) {
      const nextProvider = await PhoneProvider.findOne({ accountId, isActive: true });
      if (nextProvider) {
        nextProvider.isDefault = true;
        await nextProvider.save();
        promoted = nextProvider.displayName || String(nextProvider._id);
      }
    }

    const remaining = await PhoneProvider.countDocuments({ accountId });

    logger.info('PHONE_PROVIDER_DELETED', 'Phone provider deleted', {
      accountId,
      data: {
        providerId: id,
        vapiNumberReleased,
        assistantsDetached: detached.modifiedCount,
        promotedDefault: promoted,
        remaining,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Phone provider deleted successfully',
      vapiNumberReleased,
      assistantsDetached: detached.modifiedCount,
      promotedDefault: promoted,
      remaining,
      // Lets the UI say something useful rather than implying calling is broken.
      usingSharedDefault: remaining === 0,
    });

  } catch (error) {
    console.error('Failed to delete phone provider:', error);
    return NextResponse.json({
      error: 'Failed to delete phone provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}