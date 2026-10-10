import { google } from 'googleapis';
import {
  CalendarProvider,
  CalendarEvent,
  CalendarEventResult,
  FindAvailabilityOptions,
  AvailabilityResult,
  TimeWindow,
} from '../types';
import { logger } from '@/lib/logger';
import CalendarConnection from '@/models/CalendarConnection';
import { connectToDatabase } from '@/lib/mongodb';
import * as Sentry from '@sentry/nextjs';

/**
 * `calendar.events` grants events.insert but NOT freebusy.query, and the
 * freebusy scopes grant the reverse — verified against
 * developers.google.com/workspace/calendar/api/v3/reference/freebusy/query.
 * Both halves of speed-to-lead booking therefore need their own scope.
 *
 * Tokens issued before these were added carry only `calendar.events`; those
 * users must re-consent once (see include_granted_scopes in getAuthUrl).
 */
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/calendar.events.freebusy',
];

/** How far past the requested slot to look when proposing alternatives. */
const ALTERNATIVE_SEARCH_DAYS = 4;
/** Granularity of proposed alternative start times. */
const SLOT_STEP_MINS = 30;

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/**
 * Weekday and minutes-since-midnight for an instant, as observed in `timeZone`.
 * Uses Intl rather than date math so DST is handled by the platform.
 */
function zonedParts(date: Date, timeZone: string): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  // hourCycle h23 can emit "24" at midnight on some engines.
  const hour = parseInt(get('hour'), 10) % 24;
  return {
    weekday: WEEKDAY_INDEX[get('weekday')] ?? 0,
    minutes: hour * 60 + parseInt(get('minute'), 10),
  };
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** True when [start,end) sits inside the configured open hours for its weekday. */
function withinHours(start: Date, end: Date, opts: FindAvailabilityOptions): boolean {
  if (!opts.businessHours) return true;

  const s = zonedParts(start, opts.timezone);
  const e = zonedParts(end, opts.timezone);
  const day = opts.businessHours[s.weekday];
  if (!day) return false;

  // A slot that runs past midnight into another day is never inside open hours.
  if (e.weekday !== s.weekday) return false;
  return s.minutes >= toMinutes(day.open) && e.minutes <= toMinutes(day.close);
}

/** Half-open overlap: [aStart,aEnd) intersects [bStart,bEnd). */
function overlapsAny(start: Date, end: Date, busy: TimeWindow[]): boolean {
  const s = start.getTime();
  const e = end.getTime();
  return busy.some((b) => {
    const bs = new Date(b.start).getTime();
    const be = new Date(b.end).getTime();
    return s < be && bs < e;
  });
}

/** Walks forward in fixed steps collecting bookable slots to offer the caller. */
function buildAlternatives(
  from: Date,
  until: Date,
  busy: TimeWindow[],
  opts: FindAvailabilityOptions
): TimeWindow[] {
  const wanted = opts.maxAlternatives ?? 3;
  const durationMs = opts.durationMins * 60_000;
  const stepMs = SLOT_STEP_MINS * 60_000;
  const out: TimeWindow[] = [];

  // Never propose a slot in the past, even if the caller asked about one.
  const floor = Math.max(from.getTime(), Date.now());
  let cursor = Math.ceil(floor / stepMs) * stepMs;

  while (cursor + durationMs <= until.getTime() && out.length < wanted) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor + durationMs);
    if (withinHours(slotStart, slotEnd, opts) && !overlapsAny(slotStart, slotEnd, busy)) {
      out.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
      cursor += durationMs; // don't offer overlapping alternatives
      continue;
    }
    cursor += stepMs;
  }

  return out;
}

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

  async isAuthenticated(accountId: string): Promise<boolean> {
    try {
      await connectToDatabase();
      const connection = await CalendarConnection.findOne({ 
        accountId, 
        provider: 'google', 
        isActive: true 
      });

      if (!connection || !connection.accessToken) {
        return false;
      }

      // Check if token is expired
      if (connection.tokenExpiry && connection.tokenExpiry < new Date()) {
        // Try to refresh the token
        return await this.refreshAuth(accountId);
      }

      return true;
    } catch (error) {
      logger.error('GOOGLE_AUTH_CHECK', 'Failed to check Google Calendar authentication', {
        accountId,
        error
      });
      return false;
    }
  }

  async authenticate(accountId: string, authData: { code: string }): Promise<void> {
    try {
      console.log('Google Calendar authenticate starting', { accountId, hasCode: !!authData.code });
      
      await connectToDatabase();
      console.log('Google Calendar authenticate database connected', { accountId });

      // Exchange authorization code for tokens
      console.log('Google Calendar authenticate exchanging code for tokens', { accountId });
      const { tokens } = await this.oauth2Client.getToken(authData.code);
      console.log('Google Calendar authenticate tokens received', { 
        accountId, 
        hasAccessToken: !!tokens.access_token, 
        hasRefreshToken: !!tokens.refresh_token 
      });
      
      logger.info('GOOGLE_AUTH_SUCCESS', 'Google Calendar authentication successful', {
        accountId,
        data: { 
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiryDate: tokens.expiry_date
        }
      });

      // Save or update calendar connection
      console.log('Google Calendar authenticate saving to database', { accountId });
      await CalendarConnection.findOneAndUpdate(
        { accountId, provider: 'google' },
        {
          accountId,
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
      console.log('Google Calendar authenticate successfully saved to database', { accountId });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('Google Calendar authenticate failed', {
        errorMessage: errorMsg,
        accountId,
        hasCode: !!authData.code,
        codePreview: authData.code ? `${authData.code.substring(0, 20)}...` : null
      });
      
      Sentry.captureException(error, {
        tags: {
          component: 'google-calendar-authenticate'
        },
        extra: {
          accountId,
          hasCode: !!authData.code
        }
      });
      
      logger.error('GOOGLE_AUTH_ERROR', 'Google Calendar authentication failed', {
        accountId,
        error
      });
      
      throw new Error(`Failed to authenticate with Google Calendar: ${errorMsg}`);
    }
  }

  async refreshAuth(accountId: string): Promise<boolean> {
    try {
      await connectToDatabase();
      const connection = await CalendarConnection.findOne({ 
        accountId, 
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
        accountId,
        data: { expiryDate: credentials.expiry_date }
      });

      return true;
    } catch (error) {
      logger.error('GOOGLE_TOKEN_REFRESH_ERROR', 'Failed to refresh Google Calendar token', {
        accountId,
        error
      });
      return false;
    }
  }

  async createEvent(accountId: string, event: CalendarEvent): Promise<CalendarEventResult> {
    try {
      await connectToDatabase();
      const connection = await CalendarConnection.findOne({ 
        accountId, 
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
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
      };

      logger.info('GOOGLE_CREATE_EVENT', 'Creating Google Calendar event', {
        accountId,
        data: { 
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          calendarId: connection.calendarId
        }
      });

      const response = await calendar.events.insert({
        calendarId: connection.calendarId || 'primary',
        conferenceDataVersion: 1,
        sendUpdates: 'all',
        requestBody: googleEvent,
      });

      logger.info('GOOGLE_EVENT_CREATED', 'Google Calendar event created successfully', {
        accountId,
        data: { 
          eventId: response.data.id,
          title: event.title,
          link: response.data.htmlLink,
          meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri,
          attendees: event.attendees,
          attendeesCount: event.attendees?.length || 0
        }
      });

      return {
        success: true,
        eventId: response.data.id!,
        provider: this.name
      };

    } catch (error) {
      logger.error('GOOGLE_CREATE_EVENT_ERROR', 'Failed to create Google Calendar event', {
        accountId,
        error,
        data: { eventTitle: event.title }
      });

      // Check if it's an auth error and try to refresh
      if (error instanceof Error && error.message.includes('invalid_grant')) {
        const refreshed = await this.refreshAuth(accountId);
        if (refreshed) {
          // Retry once after refresh
          try {
            return await this.createEvent(accountId, event);
          } catch (retryError) {
            logger.error('GOOGLE_CREATE_EVENT_RETRY_ERROR', 'Failed to create event after token refresh', {
              accountId,
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

  async updateEvent(accountId: string, eventId: string, event: CalendarEvent): Promise<CalendarEventResult> {
    try {
      await connectToDatabase();
      const connection = await CalendarConnection.findOne({ 
        accountId, 
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
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
      };

      const response = await calendar.events.update({
        calendarId: connection.calendarId || 'primary',
        eventId: eventId,
        conferenceDataVersion: 1,
        sendUpdates: 'all',
        requestBody: googleEvent,
      });

      logger.info('GOOGLE_EVENT_UPDATED', 'Google Calendar event updated successfully', {
        accountId,
        data: { eventId, title: event.title }
      });

      return {
        success: true,
        eventId: response.data.id!,
        provider: this.name
      };

    } catch (error) {
      logger.error('GOOGLE_UPDATE_EVENT_ERROR', 'Failed to update Google Calendar event', {
        accountId,
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

  async deleteEvent(accountId: string, eventId: string): Promise<CalendarEventResult> {
    try {
      await connectToDatabase();
      const connection = await CalendarConnection.findOne({ 
        accountId, 
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
        accountId,
        data: { eventId }
      });

      return {
        success: true,
        eventId,
        provider: this.name
      };

    } catch (error) {
      logger.error('GOOGLE_DELETE_EVENT_ERROR', 'Failed to delete Google Calendar event', {
        accountId,
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

  /**
   * Answers "is this slot bookable, and if not what else is?" via freebusy.query.
   *
   * freebusy returns only busy ranges — never event titles or attendees — so we
   * read the strict minimum from what is often a customer's own calendar.
   */
  async findAvailability(accountId: string, options: FindAvailabilityOptions): Promise<AvailabilityResult> {
    const requested: TimeWindow = { start: options.start, end: options.end };
    const base: AvailabilityResult = {
      free: false,
      requested,
      busy: [],
      alternatives: [],
      provider: this.name,
    };

    try {
      await connectToDatabase();
      const connection = await CalendarConnection.findOne({ accountId, provider: 'google', isActive: true });

      if (!connection?.accessToken) {
        return { ...base, error: 'Google Calendar not connected' };
      }

      this.oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      const calendarId = connection.calendarId || 'primary';

      const reqStart = new Date(options.start);
      const reqEnd = new Date(options.end);
      if (Number.isNaN(reqStart.getTime()) || Number.isNaN(reqEnd.getTime()) || reqEnd <= reqStart) {
        return { ...base, error: 'Invalid requested window' };
      }

      // Search far enough past the requested slot to have alternatives to offer.
      const searchEnd = new Date(reqStart.getTime() + ALTERNATIVE_SEARCH_DAYS * 86400_000);

      const fb = await calendar.freebusy.query({
        requestBody: {
          timeMin: reqStart.toISOString(),
          timeMax: searchEnd.toISOString(),
          timeZone: options.timezone,
          items: [{ id: calendarId }],
        },
      });

      const raw = fb.data.calendars?.[calendarId]?.busy ?? [];
      const busy: TimeWindow[] = raw
        .filter((b): b is { start: string; end: string } => !!b.start && !!b.end)
        .map((b) => ({ start: b.start, end: b.end }));

      const free = !overlapsAny(reqStart, reqEnd, busy) && withinHours(reqStart, reqEnd, options);

      const alternatives = free
        ? []
        : buildAlternatives(reqStart, searchEnd, busy, options);

      logger.info('GOOGLE_FREEBUSY', 'Availability checked', {
        accountId,
        data: { requested: options.start, free, busyBlocks: busy.length, alternatives: alternatives.length },
      });

      return { ...base, free, busy, alternatives };
    } catch (error: any) {
      // A grant issued before the freebusy scopes existed fails here, not at
      // connect time — surface it so the UI can prompt a one-click reconnect
      // instead of the agent dying mid-call.
      const message = error?.message || String(error);
      const insufficient =
        error?.code === 403 &&
        /insufficient|ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficientPermissions/i.test(message);

      logger.error('GOOGLE_FREEBUSY_ERROR', 'Availability lookup failed', {
        accountId,
        error,
        data: { insufficientScope: insufficient },
      });

      return {
        ...base,
        error: insufficient ? 'Calendar connection is missing the availability permission' : message,
        needsReconnect: insufficient,
      };
    }
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_CALENDAR_SCOPES,
      prompt: 'consent', // Force consent screen to get refresh token
      // Keeps scopes granted by an earlier connection, so a user who authorised
      // before the freebusy scopes were added only has to approve the new
      // permission rather than redo the whole setup.
      include_granted_scopes: true,
    });
  }
}