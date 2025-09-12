import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import Assistant from '@/models/Assistant';
import UsageTracking from '@/models/UsageTracking';
import Credit from '@/models/Credit';
import { PricingService } from '@/lib/pricing';
import { logger } from './logger';

export interface UsageSummary {
  planType: string;
  planName: string;
  
  // Minutes
  minutesUsed: number;
  minuteLimit: number; // -1 for unlimited
  minutesRemaining: number; // -1 for unlimited
  minutesOverage: number;
  
  // Assistants
  assistantsCreated: number;
  assistantLimit: number; // -1 for unlimited
  assistantsRemaining: number; // -1 for unlimited
  
  // Billing
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  isOverLimit: boolean;
  isPayAsYouGo: boolean;
  
  // Costs
  currentPeriodCost: number;
  overageCost: number;
}

export interface ValidationResult {
  canCreate: boolean;
  canCall: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  overage?: {
    minutes: number;
    cost: number;
  };
}

export interface UpgradeOption {
  planType: string;
  planName: string;
  monthlyPrice: number;
  minuteLimit: number;
  assistantLimit: number;
  savings?: number;
}

export class UsageValidator {
  
  async canCreateAssistant(userId: string): Promise<ValidationResult> {
    try {
      await connectToDatabase();
      
      const subscription = await this.getOrCreateSubscription(userId);
      
      logger.info('ASSISTANT_VALIDATION_CHECK', 'Checking assistant creation permission', {
        userId,
        subscriptionExists: !!subscription,
        subscriptionId: subscription?._id,
        planType: subscription?.planType,
        creditBalance: subscription?.creditBalance
      });
      
      // No subscription = no payment = blocked
      if (!subscription) {
        return {
          canCreate: false,
          canCall: false,
          reason: `Payment required to create assistants. Pay $${await PricingService.getInitialPaygCharge()} for Pay-as-you-go or choose a monthly plan.`,
          upgradeRequired: true
        };
      }
      
      const currentAssistants = await Assistant.countDocuments({ userId, isActive: true });
      
      logger.info('ASSISTANT_VALIDATION_DETAILS', 'Assistant creation validation details', {
        userId,
        currentAssistants,
        subscriptionData: {
          planType: subscription.planType,
          creditBalance: subscription.creditBalance,
          assistantsCreated: subscription.assistantsCreated,
          assistantLimit: subscription.assistantLimit
        }
      });
      
      // Check if can afford assistant (quota or credits)
      let affordability;
      try {
        affordability = subscription.canAffordAssistant();
      } catch (methodError) {
        logger.error('AFFORDABILITY_CHECK_ERROR', 'canAffordAssistant method failed', {
          userId,
          subscriptionId: subscription._id,
          errorMessage: methodError instanceof Error ? methodError.message : 'Unknown error',
          errorStack: methodError instanceof Error ? methodError.stack : null,
          subscriptionMethods: Object.getOwnPropertyNames(subscription),
          hasCanAffordMethod: typeof subscription.canAffordAssistant === 'function',
          methodError
        });
        // Fallback to manual check
        if (subscription.planType === 'payg') {
          affordability = { 
            canAfford: (subscription.creditBalance || 0) >= await PricingService.getAssistantCost(), 
            cost: await PricingService.getAssistantCost(), 
            useCredits: true 
          };
        } else {
          let assistantsRemaining;
          try {
            assistantsRemaining = subscription.getAssistantsRemaining();
          } catch (err) {
            // Fallback calculation
            const totalLimit = subscription.assistantLimit + (subscription.extraAssistants || 0);
            assistantsRemaining = totalLimit === -1 ? -1 : Math.max(0, totalLimit - (subscription.assistantsCreated || 0));
          }
          
          if (assistantsRemaining > 0) {
            affordability = { canAfford: true, cost: 0, useCredits: false };
          } else {
            affordability = { 
              canAfford: (subscription.creditBalance || 0) >= await PricingService.getAssistantCost(), 
              cost: await PricingService.getAssistantCost(), 
              useCredits: true 
            };
          }
        }
      }
      
      if (affordability.canAfford) {
        return { 
          canCreate: true, 
          canCall: true,
          reason: affordability.useCredits ? `Will charge $${affordability.cost} from credits` : 'Using plan quota'
        };
      }
      
      // Cannot afford
      const assistantLimit = subscription.getTotalAssistantLimit();
      const reason = subscription.planType === 'payg' 
        ? `Insufficient credits. Need $${await PricingService.getAssistantCost()} to create assistant (current balance: $${subscription.creditBalance})`
        : `Assistant limit reached (${currentAssistants}/${assistantLimit}). Top up with $${await PricingService.getAssistantCost()} or upgrade your plan.`;
      
      return {
        canCreate: false,
        canCall: false,
        reason,
        upgradeRequired: true
      };
      
    } catch (error) {
      logger.error('USAGE_VALIDATION_ERROR', 'Failed to validate assistant creation', {
        userId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : null,
        errorType: typeof error,
        error: error
      });
      
      // Fail closed for new users
      return { 
        canCreate: false, 
        canCall: false,
        reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support.`,
        upgradeRequired: true
      };
    }
  }
  
  async canMakeCall(userId: string, estimatedMinutes: number): Promise<ValidationResult> {
    try {
      await connectToDatabase();
      
      const subscription = await this.getOrCreateSubscription(userId);
      const estimatedCost = estimatedMinutes * await PricingService.getPaygMinuteCost();
      
      // No subscription = no payment = blocked
      if (!subscription) {
        return {
          canCreate: false,
          canCall: false,
          reason: `Payment required to make calls. Pay $${await PricingService.getInitialPaygCharge()} for Pay-as-you-go or choose a monthly plan.`,
          upgradeRequired: true,
          overage: {
            minutes: estimatedMinutes,
            cost: estimatedCost
          }
        };
      }
      
      // Check if can afford call (quota or credits)
      if (subscription.canAffordCall(estimatedCost)) {
        const minutesRemaining = subscription.getMinutesRemaining();
        const usingCredits = subscription.planType === 'payg' || minutesRemaining <= 0;
        
        return { 
          canCreate: true, 
          canCall: true,
          reason: usingCredits ? `Will charge $${estimatedCost.toFixed(2)} from credits` : 'Using plan quota'
        };
      }
      
      // Cannot afford call
      const minutesRemaining = subscription.getMinutesRemaining();
      const reason = subscription.planType === 'payg' 
        ? `Insufficient credits. Need $${estimatedCost.toFixed(2)} for ${estimatedMinutes} minutes (current balance: $${subscription.creditBalance})`
        : `Not enough minutes remaining (${minutesRemaining}/${subscription.getTotalMinuteLimit()}). Top up with credits or upgrade your plan.`;
      
      return {
        canCreate: true,
        canCall: false,
        reason,
        upgradeRequired: true,
        overage: {
          minutes: estimatedMinutes,
          cost: estimatedCost
        }
      };
      
    } catch (error) {
      logger.error('USAGE_VALIDATION_ERROR', 'Failed to validate call permission', {
        userId,
        estimatedMinutes,
        error
      });
      
      // Fail closed for new users
      return { 
        canCreate: false, 
        canCall: false,
        reason: 'Validation error. Please try again or contact support.',
        upgradeRequired: true
      };
    }
  }
  
  async getCurrentUsage(userId: string): Promise<UsageSummary> {
    try {
      await connectToDatabase();
      
      const subscription = await this.getOrCreateSubscription(userId);
      const currentAssistants = await Assistant.countDocuments({ userId, isActive: true });
      
      // No subscription = no payment = return blocked state
      if (!subscription) {
        return {
          planType: 'none',
          planName: 'No Plan (Payment Required)',
          
          // Minutes
          minutesUsed: 0,
          minuteLimit: 0,
          minutesRemaining: 0,
          minutesOverage: 0,
          
          // Assistants
          assistantsCreated: currentAssistants,
          assistantLimit: 0,
          assistantsRemaining: 0,
          
          // Billing
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
          isOverLimit: true,
          isPayAsYouGo: false,
          
          // Costs
          currentPeriodCost: 0,
          overageCost: 0,
          
          // Credit info
          creditBalance: 0,
          needsTopup: true
        };
      }
      
      const minuteLimit = subscription.getTotalMinuteLimit();
      const assistantLimit = subscription.getTotalAssistantLimit();
      const minutesUsed = subscription.minutesUsed;
      
      const minutesRemaining = minuteLimit === -1 ? -1 : Math.max(0, minuteLimit - minutesUsed);
      const assistantsRemaining = assistantLimit === -1 ? -1 : Math.max(0, assistantLimit - currentAssistants);
      const minutesOverage = minuteLimit === -1 ? 0 : Math.max(0, minutesUsed - minuteLimit);
      
      // Get current period cost from usage tracking
      const usageTracking = await UsageTracking.findOrCreateForMonth(userId);
      
      return {
        planType: subscription.planType,
        planName: subscription.planName,
        
        // Minutes
        minutesUsed,
        minuteLimit,
        minutesRemaining,
        minutesOverage,
        
        // Assistants
        assistantsCreated: currentAssistants,
        assistantLimit,
        assistantsRemaining,
        
        // Billing
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        isOverLimit: minutesOverage > 0 || (assistantLimit !== -1 && currentAssistants > assistantLimit),
        isPayAsYouGo: subscription.planType === 'payg',
        
        // Costs
        currentPeriodCost: usageTracking.totalCost,
        overageCost: usageTracking.overageCost,
        
        // Credit info
        creditBalance: subscription.creditBalance,
        needsTopup: subscription.creditBalance <= subscription.minimumBalance
      };
      
    } catch (error) {
      logger.error('USAGE_SUMMARY_ERROR', 'Failed to get usage summary', {
        userId,
        error
      });
      
      // Return safe defaults
      return {
        planType: 'starter',
        planName: 'Starter Plan',
        minutesUsed: 0,
        minuteLimit: 500,
        minutesRemaining: 500,
        minutesOverage: 0,
        assistantsCreated: 0,
        assistantLimit: 1,
        assistantsRemaining: 1,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        isOverLimit: false,
        isPayAsYouGo: false,
        currentPeriodCost: 0,
        overageCost: 0
      };
    }
  }
  
  async trackCallUsage(userId: string, assistantId: string, assistantName: string, durationSeconds: number): Promise<void> {
    try {
      await connectToDatabase();
      
      const minutes = Math.ceil(durationSeconds / 60); // Round up to next minute
      const subscription = await this.getOrCreateSubscription(userId);
      
      // Update subscription usage
      subscription.minutesUsed += minutes;
      
      // Calculate cost based on plan type
      let cost = 0;
      if (subscription.planType === 'payg') {
        cost = minutes * await PricingService.getPaygMinuteCost();
      } else {
        // Check if this is overage usage
        const minuteLimit = subscription.getTotalMinuteLimit();
        if (minuteLimit !== -1 && subscription.minutesUsed > minuteLimit) {
          const overageMinutes = Math.min(minutes, subscription.minutesUsed - minuteLimit);
          cost = overageMinutes * await PricingService.getOverageMinuteCost();
        }
      }
      
      // Deduct cost from credit balance if there's a cost
      if (cost > 0) {
        const currentBalance = subscription.creditBalance || 0;
        subscription.creditBalance = Math.max(0, currentBalance - cost);
        subscription.markModified('creditBalance');
        
        // Log the usage deduction as a Credit transaction for audit trail
        try {
          await Credit.createUsage(
            userId,
            cost,
            `Call usage: ${minutes} minutes via ${assistantName}`,
            `call-${assistantId}-${Date.now()}`,
            currentBalance
          );
        } catch (creditError) {
          logger.error('CREDIT_USAGE_LOG_ERROR', 'Failed to log credit usage transaction', {
            userId,
            assistantId,
            cost,
            creditError
          });
        }
        
        logger.info('CREDITS_DEDUCTED', 'Credits deducted for call usage', {
          userId,
          assistantId,
          minutes,
          cost,
          balanceBefore: currentBalance,
          balanceAfter: subscription.creditBalance
        });
      }
      
      await subscription.save();
      
      // Update detailed usage tracking
      const usageTracking = await UsageTracking.findOrCreateForMonth(userId);
      usageTracking.addCallUsage(assistantId as any, assistantName, minutes, cost);
      
      if (cost > 0 && subscription.planType !== 'payg') {
        usageTracking.overageCost += cost;
      }
      
      await usageTracking.save();
      
      logger.info('USAGE_TRACKED', 'Call usage tracked successfully', {
        userId,
        assistantId,
        minutes,
        cost,
        totalMinutesUsed: subscription.minutesUsed
      });
      
    } catch (error) {
      logger.error('USAGE_TRACKING_ERROR', 'Failed to track call usage', {
        userId,
        assistantId,
        durationSeconds,
        error
      });
    }
  }
  
  async getUpgradeOptions(userId: string): Promise<UpgradeOption[]> {
    try {
      const subscription = await this.getOrCreateSubscription(userId);
      const currentPlan = subscription?.planType || 'none';
      
      // Only PAYG is supported
      if (currentPlan === 'none') {
        // User hasn't paid yet - offer PAYG
        return [
          { 
            planType: 'payg', 
            planName: 'Pay-as-you-go', 
            monthlyPrice: 0, // No monthly fee, pay per minute
            minuteLimit: -1, // Unlimited
            assistantLimit: -1, // Unlimited
            savings: undefined 
          }
        ];
      }
      
      // User already has PAYG - no upgrade options needed
      return [];
        
    } catch (error) {
      logger.error('UPGRADE_OPTIONS_ERROR', 'Failed to get upgrade options', { userId, error });
      return [];
    }
  }
  
  private async getOrCreateSubscription(userId: string): Promise<any | null> {
    let subscription = await Subscription.findOne({ userId, isActive: true });
    // Don't create default subscriptions - users must pay first
    return subscription;
  }
  
  async resetBillingPeriod(userId: string): Promise<void> {
    try {
      const subscription = await Subscription.findOne({ userId, isActive: true });
      if (!subscription) return;
      
      subscription.resetBillingPeriod();
      await subscription.save();
      
      logger.info('BILLING_PERIOD_RESET', 'Billing period reset for user', {
        userId,
        newPeriodStart: subscription.currentPeriodStart,
        newPeriodEnd: subscription.currentPeriodEnd
      });
      
    } catch (error) {
      logger.error('BILLING_RESET_ERROR', 'Failed to reset billing period', {
        userId,
        error
      });
    }
  }
}

export const usageValidator = new UsageValidator();