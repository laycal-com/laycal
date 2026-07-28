export interface CalendarEvent {
  title: string;
  startTime: string; // ISO 8601 format
  endTime: string;   // ISO 8601 format
  description?: string;
  location?: string;
  attendees?: string[];
}

export interface CalendarEventResult {
  success: boolean;
  eventId?: string;
  error?: string;
  provider: string;
}

/** A half-open time range, ISO 8601. */
export interface TimeWindow {
  start: string;
  end: string;
}

/** 0 = Sunday … 6 = Saturday. Weekdays absent from the map are treated as closed. */
export type BusinessHours = Record<number, { open: string; close: string } | undefined>;

export interface FindAvailabilityOptions {
  /** Start of the slot the caller wants to book. */
  start: string;
  /** End of that slot. */
  end: string;
  /** Length of the visit, used when proposing alternatives. */
  durationMins: number;
  /** IANA zone used to interpret businessHours. */
  timezone: string;
  businessHours?: BusinessHours;
  /** How many fallback slots to offer when the requested one is taken. */
  maxAlternatives?: number;
}

export interface AvailabilityResult {
  /** True when the exact requested window is bookable. */
  free: boolean;
  requested: TimeWindow;
  /** Busy blocks reported inside the search range. */
  busy: TimeWindow[];
  /** Bookable slots to offer when `free` is false. */
  alternatives: TimeWindow[];
  provider: string;
  error?: string;
  /**
   * Set when the stored OAuth grant predates the freebusy scope. The connection
   * still works for booking but cannot answer availability until the user
   * re-consents — surfaced so the UI can prompt a reconnect.
   */
  needsReconnect?: boolean;
}

export interface CalendarProvider {
  name: string;
  isAuthenticated(userId: string): Promise<boolean>;
  authenticate(userId: string, authData: any): Promise<void>;
  createEvent(userId: string, event: CalendarEvent): Promise<CalendarEventResult>;
  updateEvent(userId: string, eventId: string, event: CalendarEvent): Promise<CalendarEventResult>;
  deleteEvent(userId: string, eventId: string): Promise<CalendarEventResult>;
  refreshAuth(userId: string): Promise<boolean>;
  findAvailability(userId: string, options: FindAvailabilityOptions): Promise<AvailabilityResult>;
}

export interface AppointmentData {
  callId: string;
  status: string;
  appointment: {
    title: string;
    startTime: string;
    endTime: string;
    customer: {
      name: string;
      phone: string;
      /** Read by manager.formatEventDescription and used as the event attendee. */
      email?: string;
    };
    notes?: string;
  };
}

export interface CalendarConnection {
  userId: string;
  provider: 'google' | 'outlook' | 'ical';
  isActive: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  calendarId?: string;
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}