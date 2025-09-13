// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';
const isTest = environment === 'test';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment,

  // Add integrations for server-side logging
  integrations: [
    // Send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: isProduction ? 0.1 : isTest ? 0 : 1,

  // Enable logs to be sent to Sentry
  enableLogs: !isTest,

  // Prevent data scrubbing for logs
  beforeSendLog: (log) => {
    // Don't filter any logs in development/debugging
    if (!isProduction) {
      return log;
    }
    
    // In production, you can still allow error logs with full details
    if (log.level === 'error' || log.level === 'fatal') {
      return log;
    }
    
    return log;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: !isProduction && !isTest,

  // Don't initialize Sentry in test environment
  enabled: !isTest,

  // Prevent data scrubbing for events/errors
  beforeSend(event) {
    // In development, allow all data
    if (!isProduction) {
      return event;
    }
    
    // In production, preserve error details for debugging
    // but you can selectively scrub sensitive data
    if (event.extra) {
      // Keep error debugging fields
      const allowedFields = [
        'errorMessage', 'errorStack', 'userId', 'url', 
        'searchParams', 'hasCode', 'codePreview'
      ];
      
      // Only scrub fields that aren't in our allowed list
      Object.keys(event.extra).forEach(key => {
        if (!allowedFields.includes(key)) {
          const value = event.extra![key];
          if (typeof value === 'string') {
            // Scrub tokens, secrets, and full authorization codes
            if (value.includes('access_token') || 
                value.includes('refresh_token') || 
                value.includes('client_secret')) {
              event.extra![key] = '[SCRUBBED_TOKEN]';
            }
          }
        }
      });
    }
    
    return event;
  },
});
