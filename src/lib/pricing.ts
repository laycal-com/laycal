import { connectToDatabase } from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';

export interface PricingConfig {
  assistant_base_cost: number;
  cost_per_minute_payg: number;
  cost_per_minute_overage: number;
  minimum_topup_amount: number;
  initial_payg_charge: number;
  payg_initial_credits: number;
}

// Default pricing values as fallback
const DEFAULT_PRICING: PricingConfig = {
  assistant_base_cost: 20,
  cost_per_minute_payg: 0.07,
  cost_per_minute_overage: 0.05,
  minimum_topup_amount: 5,
  initial_payg_charge: 25,
  payg_initial_credits: 5
};

// Cache for pricing to avoid frequent database calls
let pricingCache: PricingConfig | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export class PricingService {
  /**
   * Get current pricing configuration
   * Uses caching to improve performance
   */
  static async getPricing(): Promise<PricingConfig> {
    const now = Date.now();
    
    // Return cached pricing if still valid
    if (pricingCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return pricingCache;
    }

    try {
      await connectToDatabase();
      const settings = await SystemSettings.getSettingsByCategory('pricing');
      
      pricingCache = {
        assistant_base_cost: settings.assistant_base_cost || DEFAULT_PRICING.assistant_base_cost,
        cost_per_minute_payg: settings.cost_per_minute_payg || DEFAULT_PRICING.cost_per_minute_payg,
        cost_per_minute_overage: settings.cost_per_minute_overage || DEFAULT_PRICING.cost_per_minute_overage,
        minimum_topup_amount: settings.minimum_topup_amount || DEFAULT_PRICING.minimum_topup_amount,
        initial_payg_charge: settings.initial_payg_charge || DEFAULT_PRICING.initial_payg_charge,
        payg_initial_credits: settings.payg_initial_credits || DEFAULT_PRICING.payg_initial_credits
      };
      
      cacheTimestamp = now;
      return pricingCache;
      
    } catch (error) {
      console.error('Failed to fetch pricing from database:', error);
      // Return default pricing if database fails
      return DEFAULT_PRICING;
    }
  }

  /**
   * Clear the pricing cache (useful when admin updates pricing)
   */
  static clearCache(): void {
    pricingCache = null;
    cacheTimestamp = 0;
  }

  /**
   * Get specific pricing value
   */
  static async getAssistantCost(): Promise<number> {
    const pricing = await this.getPricing();
    return pricing.assistant_base_cost;
  }

  static async getPaygMinuteCost(): Promise<number> {
    const pricing = await this.getPricing();
    return pricing.cost_per_minute_payg;
  }

  static async getOverageMinuteCost(): Promise<number> {
    const pricing = await this.getPricing();
    return pricing.cost_per_minute_overage;
  }

  static async getMinimumTopupAmount(): Promise<number> {
    const pricing = await this.getPricing();
    return pricing.minimum_topup_amount;
  }

  static async getInitialPaygCharge(): Promise<number> {
    const pricing = await this.getPricing();
    return pricing.initial_payg_charge;
  }

  static async getPaygInitialCredits(): Promise<number> {
    const pricing = await this.getPricing();
    return pricing.payg_initial_credits;
  }
}