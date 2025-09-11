import { NextResponse } from 'next/server';
import { PricingService } from '@/lib/pricing';

export async function GET() {
  try {
    // Use the pricing service which handles caching and defaults
    const pricing = await PricingService.getPricing();
    return NextResponse.json(pricing);
    
  } catch (error) {
    console.error('Failed to get pricing settings:', error);
    
    // Return default pricing if everything fails
    return NextResponse.json({
      assistant_base_cost: 20,
      cost_per_minute_payg: 0.07,
      cost_per_minute_overage: 0.05,
      minimum_topup_amount: 5,
      initial_payg_charge: 25,
      payg_initial_credits: 5
    });
  }
}