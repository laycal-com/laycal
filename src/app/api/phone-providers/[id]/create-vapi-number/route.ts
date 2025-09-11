import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import PhoneProvider from '@/models/PhoneProvider';
import { tenantVapiService } from '@/lib/tenantVapi';

// POST - Manually create/recreate Vapi phone number for a provider
export async function POST(
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

    try {
      // Force creation of a new Vapi phone number
      const vapiPhoneNumberId = await tenantVapiService.createVapiPhoneNumber(provider);
      
      // Update provider with new Vapi phone number ID
      provider.vapiPhoneNumberId = vapiPhoneNumberId;
      await provider.save();

      return NextResponse.json({
        success: true,
        message: 'Vapi phone number created successfully',
        vapiPhoneNumberId: vapiPhoneNumberId
      });

    } catch (vapiError) {
      console.error('Failed to create Vapi phone number:', vapiError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create Vapi phone number',
        details: vapiError instanceof Error ? vapiError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in create Vapi number endpoint:', error);
    return NextResponse.json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}