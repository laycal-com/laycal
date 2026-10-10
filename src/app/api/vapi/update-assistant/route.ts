import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { auth } from '@clerk/nextjs/server';
import { updateVapiAssistantConfig } from '@/lib/updateVapiAssistant';

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await getAccountAuth();

    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 Updating Vapi assistant configuration...');
    
    const result = await updateVapiAssistantConfig();
    
    console.log('✅ Vapi assistant updated successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Vapi assistant configuration updated successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Failed to update Vapi assistant:', error);
    return NextResponse.json({
      error: 'Failed to update assistant configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}