import { google } from 'googleapis';
import { CalendarProvider, CalendarEvent, CalendarEventResult } from '../types';
import { logger } from '@/lib/logger';
import CalendarConnection from '@/models/CalendarConnection';
import { connectToDatabase } from '@/lib/mongodb';

export class GoogleCalendarProvider implements CalendarProvider {
  name = 'google';
  private oauth2Client: any;

  constructor() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      logger.error('GOOGLE_CALENDAR_CONFIG', 'Missing Google Calendar configuration', {
        data: {
          hasClientId: !!process.env.GOOGLE_CLIENT_ID,
          hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
        }
      });
    }

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`
    );
  }

  async isAuthenticated(userId: string): Promise<boolean> {
    try {
      await connectToDatabase();
      const connection = await CalendarConnection.findOne({ 
        userId, 
        provider: 'google', 
        isActive: true 
      });

      if (!connection || !connection.accessToken) {
        return false;
      }

      // Check if token is expired
      if (connection.tokenExpiry && connection.tokenExpiry < new Date()) {
        // Try to refresh the token
        return await this.refreshAuth(userId);
      }

      return true;
    } catch (error) {
      logger.error('GOOGLE_AUTH_CHECK', 'Failed to check Google Calendar authentication', {
        userId,
        error
      });
      return false;
    }
  }

  async authenticate(userId: string, authData: { code: string }): Promise<void> {
    try {
      await connectToDatabase();

      // Exchange authorization code for tokens
      const { tokens } = await this.oauth2Client.getToken(authData.code);
      
      logger.info('GOOGLE_AUTH_SUCCESS', 'Google Calendar authentication successful', {
        userId,
        data: { 
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiryDate: tokens.expiry_date
        }
      });

      // Save or update calendar connection
      await CalendarConnection.findOneAndUpdate(
        { userId, provider: 'google' },
        {
          userId,
          provider: 'google',
          isActive: true,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
          calendarId: 'primary', // Use primary calendar by default
          lastSync: new Date()
        },
        { upsert: true, new: true }
      );

    } catch (error) {
      logger.error('GOOGLE_AUTH_ERROR', 'Google Calendar authentication failed', {
        userId,
        error
      });
      throw new Error('Failed to authenticate with Google Calendar');
    }
  }

  async refreshAuth(userId: string): Promise<boolean> {
    try {
      await connectToDatabase();
      const connection = await CalendarConnection.findOne({ 
        userId, 
        provider: 'google', 
        isActive: true 
      });

      if (!connection || !connection.refreshToken) {
        return false;
      }

      this.oauth2Client.setCredentials({
        refresh_token: connection.refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update connection with new tokens
      connection.accessToken = credentials.access_token;
      if (credentials.expiry_date) {
        connection.tokenExpiry = new Date(credentials.expiry_date);
      }
      await connection.save();

      logger.info('GOOGLE_TOKEN_REFRESH', 'Google Calendar token refreshed', {
        userId,
        data: { expiryDate: credentials.expiry_date }
      });

      return true;
    } catch (error) {
      logger.error('GOOGLE_TOKEN_REFRESH_ERROR', 'Failed to refresh Google Calendar token', {
        userId,
        error
      });
      return false;
    }
  }

  async createEvent(userId: string, event: CalendarEvent): Promise<CalendarEventResult> {
    try {
      await connectToDatabase();
      const connection = await CalendarConnection.findOne({ 
        userId, 
        provider: 'google', 
        isActive: true 
      });

      if (!connection || !connection.accessToken) {
        throw new Error('Google Calendar not authenticated');
      }

      // Set up OAuth client with current tokens
      this.oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const googleEvent = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.startTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endTime,
          timeZone: 'UTC',
        },
        attendees: event.attendees?.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
      };

      logger.info('GOOGLE_CREATE_EVENT', 'Creating Google Calendar event', {
        userId,
        data: { 
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          calendarId: connection.calendarId
        }
      });

      const response = await calendar.events.insert({
        calendarId: connection.calendarId || 'primary',
        requestBody: googleEvent,
      });

      logger.info('GOOGLE_EVENT_CREATED', 'Google Calendar event created successfully', {
        userId,
        data: { 
          eventId: response.data.id,
          title: event.title,
          link: response.data.htmlLink
        }
      });

      return {
        success: true,
        eventId: response.data.id!,
        provider: this.name
      };

    } catch (error) {
      logger.error('GOOGLE_CREATE_EVENT_ERROR', 'Failed to create Google Calendar event', {
        userId,
        error,
        data: { eventTitle: event.title }
      });

      // Check if it's an auth error and try to refresh
      if (error instanceof Error && error.message.includes('invalid_grant')) {
        const refreshed = await this.refreshAuth(userId);
        if (refreshed) {
          // Retry once after refresh
          try {
            return await this.createEvent(userId, event);
          } catch (retryError) {
            logger.error('GOOGLE_CREATE_EVENT_RETRY_ERROR', 'Failed to create event after token refresh', {
              userId,
              error: retryError,
              data: { eventTitle: event.title }
            });
          }
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name
      };
    }
  }

  async updateEvent(userId: string, eventId: string, event: CalendarEvent): Promise<CalendarEventResult> {
    try {
      await connectToDatabase();
      const connection = await CalendarConnection.findOne({ 
        userId, 
        provider: 'google', 
        isActive: true 
      });

      if (!connection || !connection.accessToken) {
        throw new Error('Google Calendar not authenticated');
      }

      this.oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const googleEvent = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.startTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endTime,
          timeZone: 'UTC',
        },
        attendees: event.attendees?.map(email => ({ email })),
      };

      const response = await calendar.events.update({
        calendarId: connection.calendarId || 'primary',
        eventId: eventId,
        requestBody: googleEvent,
      });

      logger.info('GOOGLE_EVENT_UPDATED', 'Google Calendar event updated successfully', {
        userId,
        data: { eventId, title: event.title }
      });

      return {
        success: true,
        eventId: response.data.id!,
        provider: this.name
      };

    } catch (error) {
      logger.error('GOOGLE_UPDATE_EVENT_ERROR', 'Failed to update Google Calendar event', {
        userId,
        error,
        data: { eventId, eventTitle: event.title }
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name
      };
    }
  }

  async deleteEvent(userId: string, eventId: string): Promise<CalendarEventResult> {
    try {
      await connectToDatabase();
      const connection = await CalendarConnection.findOne({ 
        userId, 
        provider: 'google', 
        isActive: true 
      });

      if (!connection || !connection.accessToken) {
        throw new Error('Google Calendar not authenticated');
      }

      this.oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.delete({
        calendarId: connection.calendarId || 'primary',
        eventId: eventId,
      });

      logger.info('GOOGLE_EVENT_DELETED', 'Google Calendar event deleted successfully', {
        userId,
        data: { eventId }
      });

      return {
        success: true,
        eventId,
        provider: this.name
      };

    } catch (error) {
      logger.error('GOOGLE_DELETE_EVENT_ERROR', 'Failed to delete Google Calendar event', {
        userId,
        error,
        data: { eventId }
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name
      };
    }
  }

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent screen to get refresh token
    });
  }
}