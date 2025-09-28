// SaaS Analytics Utility for GTM Integration
// This provides type-safe analytics tracking for key SaaS metrics

declare global {
  interface Window {
    dataLayer: any[];
    trackSaaSEvent: (eventName: string, properties?: Record<string, any>) => void;
    gtag: (...args: any[]) => void;
  }
}

export interface SaaSEventProperties {
  // User properties
  user_id?: string;
  user_email?: string;
  user_plan?: 'trial' | 'payg' | 'starter' | 'growth' | 'pro' | 'enterprise' | 'none';
  user_signup_date?: string;
  days_since_signup?: number;
  
  // Plan/subscription properties
  plan_type?: string;
  plan_name?: string;
  monthly_price?: number;
  billing_period?: string;
  
  // Feature usage
  assistants_created?: number;
  calls_made?: number;
  minutes_used?: number;
  
  // Revenue properties
  transaction_id?: string;
  value?: number;
  currency?: string;
  
  // Campaign properties
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  
  // Custom properties
  [key: string]: any;
}

class SaaSAnalytics {
  private isEnabled(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.trackSaaSEvent === 'function';
  }

  // User Journey Events
  trackSignUp(properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('user_signup', {
      event_category: 'User Journey',
      event_label: 'Account Created',
      ...properties
    });
  }

  trackLogin(properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('user_login', {
      event_category: 'User Journey',
      event_label: 'User Login',
      ...properties
    });
  }

  trackLogout(properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('user_logout', {
      event_category: 'User Journey',
      event_label: 'User Logout',
      ...properties
    });
  }

  // Plan Selection & Conversion Events
  trackPlanSelected(planType: string, properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('plan_selected', {
      event_category: 'Conversion',
      event_label: `Plan Selected: ${planType}`,
      plan_type: planType,
      ...properties
    });
  }

  trackTrialStarted(properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('trial_started', {
      event_category: 'Conversion',
      event_label: 'Free Trial Started',
      plan_type: 'trial',
      value: 0,
      ...properties
    });
  }

  trackTrialConverted(newPlan: string, properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('trial_converted', {
      event_category: 'Conversion',
      event_label: `Trial Converted to ${newPlan}`,
      plan_type: newPlan,
      ...properties
    });
  }

  // Payment & Revenue Events
  trackPaymentStarted(amount: number, planType: string, properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('payment_started', {
      event_category: 'Revenue',
      event_label: 'Payment Process Started',
      value: amount,
      currency: 'USD',
      plan_type: planType,
      ...properties
    });
  }

  trackPurchase(amount: number, planType: string, properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('purchase', {
      event_category: 'Revenue',
      event_label: 'Payment Completed',
      value: amount,
      currency: 'USD',
      plan_type: planType,
      ...properties
    });

    // Also track as GTM ecommerce event
    window.trackSaaSEvent('gtm.purchase', {
      transaction_id: properties.transaction_id || `txn_${Date.now()}`,
      value: amount,
      currency: 'USD',
      items: [{
        item_id: planType,
        item_name: properties.plan_name || planType,
        category: 'SaaS Plan',
        quantity: 1,
        price: amount
      }]
    });
  }

  trackSubscriptionCancelled(planType: string, properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('subscription_cancelled', {
      event_category: 'Churn',
      event_label: `Cancelled: ${planType}`,
      plan_type: planType,
      ...properties
    });
  }

  // Feature Usage Events
  trackAssistantCreated(assistantName: string, properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('assistant_created', {
      event_category: 'Feature Usage',
      event_label: 'AI Assistant Created',
      assistant_name: assistantName,
      ...properties
    });
  }

  trackCallMade(duration: number, success: boolean, properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('call_made', {
      event_category: 'Feature Usage',
      event_label: success ? 'Successful Call' : 'Failed Call',
      call_duration: duration,
      call_success: success,
      ...properties
    });
  }

  trackLeadUploaded(leadCount: number, properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('leads_uploaded', {
      event_category: 'Feature Usage',
      event_label: 'CSV Leads Uploaded',
      lead_count: leadCount,
      ...properties
    });
  }

  trackAppointmentBooked(properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('appointment_booked', {
      event_category: 'Conversion',
      event_label: 'Appointment Scheduled',
      ...properties
    });
  }

  // Support & Engagement Events
  trackSupportTicketCreated(category: string, properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('support_ticket_created', {
      event_category: 'Support',
      event_label: `Ticket: ${category}`,
      ticket_category: category,
      ...properties
    });
  }

  trackPageView(pageName: string, properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('page_view', {
      event_category: 'Engagement',
      event_label: `Page: ${pageName}`,
      page_name: pageName,
      ...properties
    });
  }

  // Custom Event Tracking
  trackCustomEvent(eventName: string, properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent(eventName, {
      event_category: 'Custom',
      ...properties
    });
  }

  // Utility: Track user properties for segmentation
  identifyUser(userId: string, properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('user_identify', {
      event_category: 'User',
      event_label: 'User Identified',
      user_id: userId,
      ...properties
    });
  }

  // Track funnel steps
  trackFunnelStep(step: string, stepNumber: number, properties: SaaSEventProperties = {}) {
    if (!this.isEnabled()) return;
    
    window.trackSaaSEvent('funnel_step', {
      event_category: 'Funnel',
      event_label: step,
      funnel_step: step,
      step_number: stepNumber,
      ...properties
    });
  }
}

// Create singleton instance
export const analytics = new SaaSAnalytics();

// Helper function for easy imports
export const trackEvent = (eventName: string, properties?: SaaSEventProperties) => {
  analytics.trackCustomEvent(eventName, properties);
};

// Export specific tracking functions for common use cases
export const {
  trackSignUp,
  trackLogin,
  trackLogout,
  trackPlanSelected,
  trackTrialStarted,
  trackTrialConverted,
  trackPaymentStarted,
  trackPurchase,
  trackSubscriptionCancelled,
  trackAssistantCreated,
  trackCallMade,
  trackLeadUploaded,
  trackAppointmentBooked,
  trackSupportTicketCreated,
  trackPageView,
  identifyUser,
  trackFunnelStep
} = analytics;