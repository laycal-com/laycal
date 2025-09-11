import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';
import { PricingService } from '@/lib/pricing';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const authResult = await AdminAuthService.requirePermission(request, 'view_pricing');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();
    const pricingSettings = await SystemSettings.getSettingsByCategory('pricing');

    return NextResponse.json(pricingSettings);

  } catch (error) {
    logger.error('ADMIN_GET_PRICING_ERROR', 'Failed to get pricing settings', { error });
    return NextResponse.json({ error: 'Failed to get pricing settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await AdminAuthService.requirePermission(request, 'manage_pricing');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { admin } = authResult;
    const settings = await request.json();

    await connectToDatabase();

    // Validate the settings
    const requiredSettings = [
      'assistant_base_cost',
      'cost_per_minute_payg',
      'cost_per_minute_overage',
      'minimum_topup_amount',
      'initial_payg_charge',
      'payg_initial_credits'
    ];

    for (const key of requiredSettings) {
      if (!(key in settings) || typeof settings[key] !== 'number' || settings[key] < 0) {
        return NextResponse.json(
          { error: `Invalid value for ${key}` },
          { status: 400 }
        );
      }
    }

    // Update each setting
    const updatedSettings: Record<string, any> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (requiredSettings.includes(key)) {
        await SystemSettings.setSetting(
          key,
          value,
          admin._id.toString(),
          {
            type: 'number',
            category: 'pricing',
            isPublic: true
          }
        );
        updatedSettings[key] = value;
      }
    }

    // Clear pricing cache so new values take effect immediately
    PricingService.clearCache();

    logger.info('ADMIN_UPDATE_PRICING', 'Pricing settings updated', {
      adminId: admin._id.toString(),
      adminEmail: admin.email,
      updatedSettings
    });

    return NextResponse.json({
      success: true,
      settings: updatedSettings
    });

  } catch (error) {
    logger.error('ADMIN_UPDATE_PRICING_ERROR', 'Failed to update pricing settings', { error });
    return NextResponse.json({ error: 'Failed to update pricing settings' }, { status: 500 });
  }
}