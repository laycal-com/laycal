import { CalendarProvider, CalendarEvent, CalendarEventResult, AppointmentData } from './types';
import { GoogleCalendarProvider } from './providers/google';
import { logger } from '@/lib/logger';
import CalendarConnection from '@/models/CalendarConnection';
import { connectToDatabase } from '@/lib/mongodb';

export class CalendarManager {
  private providers: Map<string, CalendarProvider>;

  constructor() {
    this.providers = new Map();
    this.providers.set('google', new GoogleCalendarProvider());
    // Future providers can be added here:
    // this.providers.set('outlook', new OutlookCalendarProvider());
    // this.providers.set('ical', new ICalProvider());
  }

  getProvider(providerName: string): CalendarProvider | undefined {
    return this.providers.get(providerName);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async getUserActiveProviders(userId: string): Promise<string[]> {
    try {
      await connectToDatabase();
      
      logger.info('GET_USER_PROVIDERS', 'Looking up calendar providers for user', {
        userId
      });
      
      const connections = await CalendarConnection.find({ 
        userId, 
        isActive: true 
      }).select('provider');
      
      const providers = connections.map(conn => conn.provider);
      
      logger.info('GET_USER_PROVIDERS_RESULT', 'Found calendar providers for user', {
        userId,
        data: { 
          providerCount: providers.length,
          providers: providers,
          totalConnections: connections.length
        }
      });
      
      return providers;
    } catch (error) {
      logger.error('GET_USER_PROVIDERS', 'Failed to get user calendar providers', {
        userId,
        error
      });
      return [];
    }
  }

  async createAppointmentFromWebhook(userId: string, appointmentData: AppointmentData): Promise<void> {
    try {
      logger.info('APPOINTMENT_WEBHOOK', 'Processing appointment creation from webhook', {
        userId,
        data: {
          callId: appointmentData.callId,
          title: appointmentData.appointment.title,
          customer: appointmentData.appointment.customer.name
        }
      });

      // Get all active calendar providers for the user
      const activeProviders = await this.getUserActiveProviders(userId);
      
      if (activeProviders.length === 0) {
        logger.warn('NO_CALENDAR_PROVIDERS', 'No active calendar providers found for user', {
          userId,
          data: { callId: appointmentData.callId }
        });
        return;
      }

      // Convert appointment data to calendar event format
      const calendarEvent: CalendarEvent = {
        title: appointmentData.appointment.title,
        startTime: appointmentData.appointment.startTime,
        endTime: appointmentData.appointment.endTime,
        description: this.formatEventDescription(appointmentData),
        location: '', // Empty for now as requested
        attendees: [] // Could add customer email if available
      };

      // Create event in all active calendar providers
      const results = await Promise.allSettled(
        activeProviders.map(async (providerName) => {
          const provider = this.getProvider(providerName);
          if (!provider) {
            throw new Error(`Provider ${providerName} not found`);
          }

          return this.createEventWithRetry(provider, userId, calendarEvent);
        })
      );

      // Log results
      results.forEach((result, index) => {
        const providerName = activeProviders[index];
        
        if (result.status === 'fulfilled' && result.value.success) {
          logger.info('APPOINTMENT_CREATED', 'Calendar appointment created successfully', {
            userId,
            data: {
              provider: providerName,
              eventId: result.value.eventId,
              callId: appointmentData.callId,
              title: appointmentData.appointment.title
            }
          });
        } else {
          const error = result.status === 'rejected' ? result.reason : result.value.error;
          logger.error('APPOINTMENT_CREATE_FAILED', 'Failed to create calendar appointment', {
            userId,
            error,
            data: {
              provider: providerName,
              callId: appointmentData.callId,
              title: appointmentData.appointment.title
            }
          });
        }
      });

    } catch (error) {
      logger.error('APPOINTMENT_WEBHOOK_ERROR', 'Critical error processing appointment webhook', {
        userId,
        error,
        data: { callId: appointmentData.callId }
      });
    }
  }

  private async createEventWithRetry(
    provider: CalendarProvider, 
    userId: string, 
    event: CalendarEvent
  ): Promise<CalendarEventResult> {
    try {
      // First attempt
      const result = await provider.createEvent(userId, event);
      
      if (result.success) {
        return result;
      }

      // If first attempt failed, log and retry once
      logger.warn('CALENDAR_EVENT_RETRY', 'Calendar event creation failed, retrying', {
        userId,
        data: { 
          provider: provider.name,
          error: result.error,
          eventTitle: event.title
        }
      });

      // Retry once
      return await provider.createEvent(userId, event);

    } catch (error) {
      logger.error('CALENDAR_EVENT_CREATE_ERROR', 'Calendar event creation failed with exception', {
        userId,
        error,
        data: { 
          provider: provider.name,
          eventTitle: event.title
        }
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: provider.name
      };
    }
  }

  private formatEventDescription(appointmentData: AppointmentData): string {
    const { customer, notes } = appointmentData.appointment;
    
    let description = `Customer: ${customer.name}\n`;
    description += `Phone: ${customer.phone}\n`;
    
    if (notes) {
      description += `\nNotes: ${notes}`;
    }
    
    description += `\n\nCall ID: ${appointmentData.callId}`;
    
    return description;
  }

  async disconnectProvider(userId: string, providerName: string): Promise<void> {
    try {
      await connectToDatabase();
      
      await CalendarConnection.findOneAndUpdate(
        { userId, provider: providerName },
        { isActive: false },
        { new: true }
      );

      logger.info('CALENDAR_DISCONNECTED', 'Calendar provider disconnected', {
        userId,
        data: { provider: providerName }
      });

    } catch (error) {
      logger.error('CALENDAR_DISCONNECT_ERROR', 'Failed to disconnect calendar provider', {
        userId,
        error,
        data: { provider: providerName }
      });
      throw error;
    }
  }
}

// Export a singleton instance
export const calendarManager = new CalendarManager();