// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';
const isTest = environment === 'test';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment,

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: isProduction ? 0.1 : isTest ? 0 : 1,
  
  // Enable logs to be sent to Sentry
  enableLogs: !isTest,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: isProduction ? 0.1 : isTest ? 0 : 1.0,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: isTest ? 0 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: !isProduction && !isTest,

  // Don't initialize Sentry in test environment
  enabled: !isTest,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;