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

export interface CalendarProvider {
  name: string;
  isAuthenticated(userId: string): Promise<boolean>;
  authenticate(userId: string, authData: any): Promise<void>;
  createEvent(userId: string, event: CalendarEvent): Promise<CalendarEventResult>;
  updateEvent(userId: string, eventId: string, event: CalendarEvent): Promise<CalendarEventResult>;
  deleteEvent(userId: string, eventId: string): Promise<CalendarEventResult>;
  refreshAuth(userId: string): Promise<boolean>;
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