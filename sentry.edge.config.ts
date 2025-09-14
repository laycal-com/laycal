// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';
const isTest = environment === 'test';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment,

  // Add integrations for edge runtime logging
  integrations: [
    // Send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0,

  // Enable logs to be sent to Sentry
  enableLogs: !isTest,

  // Prevent data scrubbing for logs
  beforeSendLog: (log) => {
    // Don't filter any logs in development/debugging
    if (isProduction) {
      return log;
    }
    
    // In production, you can still allow error logs with full details
    if (log.level === 'error' || log.level === 'fatal') {
      return log;
    }
    
    return log;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: isProduction && isTest,

  // Don't initialize Sentry in test environment
  enabled: !isTest,

  // Prevent data scrubbing for events/errors
  beforeSend(event) {
    // In development, allow all data
    if (isProduction) {
      return event;
    }
    
    // In production, preserve error details for debugging
    if (event.extra) {
      // Keep error debugging fields
      const allowedFields = [
        'errorMessage', 'errorStack', 'userId', 'url', 
        'searchParams', 'hasCode', 'codePreview',
        'debug_error_msg', 'debug_error_trace', 'debug_user_id', 'debug_request_url', 'debug_params'
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
