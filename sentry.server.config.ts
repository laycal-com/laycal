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

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: isProduction ? 0.1 : isTest ? 0 : 1,

  // Enable logs to be sent to Sentry
  enableLogs: !isTest,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: !isProduction && !isTest,

  // Don't initialize Sentry in test environment
  enabled: !isTest,
});
