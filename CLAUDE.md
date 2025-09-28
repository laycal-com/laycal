# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **SaaS template** built as a **lead calling platform** using AI voice agents through Vapi integration. It's NOT a generic SaaS template despite the name - it's specifically designed for automated outbound calling to sales leads.

**Core Business Logic**: Upload CSV of leads → AI voice agent calls each lead → Track call results and appointments → Calendar integration for booking follow-ups.

## Current Platform Capabilities (Latest)

### 🤖 Advanced AI Assistant Creation
- **10-Step Prompt Wizard**: Comprehensive wizard that generates professional AI prompts without requiring users to write prompts from scratch
- **Dynamic Prompt Generation**: Creates contextual prompts based on business type, target audience, objectives, and conversation style
- **Multi-Objective Support**: Appointment booking, lead generation, information sharing, callbacks, and custom objectives
- **Advanced Email Collection**: Built-in protocols for letter-by-letter email spelling and confirmation during appointment booking
- **Conversation Flow Optimization**: Natural pacing instructions with explicit WAIT commands and response acknowledgment

### 📞 VAPI Integration Enhancements
- **Conversation Flow Control**: Optimized endpointing (300ms), interruption handling, and natural conversation pacing
- **Summary & Structured Data Extraction**: Automatic call transcription summaries and appointment data extraction (email, name, phone, appointment time)
- **Timezone-Aware Scheduling**: Dynamic timezone handling for appointment booking with VAPI template variables
- **Multi-Tenant Phone Providers**: Support for Twilio, Plivo, Nexmo/Vonage with encrypted credential storage
- **Webhook Processing**: Real-time call status updates and data extraction
- **Anti-Hangup Protection**: Disabled endCallFunction to prevent premature call termination

### 🎯 Lead Management System
- **CSV Lead Upload**: Bulk upload prospects with validation and error reporting
- **Call Status Tracking**: Real-time monitoring of call progress (pending, calling, completed, failed)
- **Appointment Management**: Structured data extraction for booking confirmations
- **Multi-Campaign Support**: Organize leads by campaigns and track performance
- **Call Results Analytics**: Detailed reporting on call outcomes and conversion rates

### 🔧 Advanced Configuration
- **Custom Objection Handling**: User-defined responses to common prospect objections
- **Business Context Integration**: Dynamic prompt generation based on business description and target audience
- **Communication Style Options**: Natural (with fillers) vs. Sharp (direct) conversation styles
- **Call Duration Controls**: Configurable call length preferences (brief, normal, detailed)
- **Custom Scripts**: Optional script integration for specific call flows

## Key Technologies & Architecture

- **Framework**: Next.js 15 with TypeScript, App Router, React 19
- **Authentication**: Clerk (not NextAuth)
- **Database**: MongoDB with Mongoose ODM
- **Payments**: PayPal integration (not Stripe)
- **AI Voice**: Vapi.ai for outbound calling
- **Phone Providers**: Multi-tenant support for Twilio, Plivo, Nexmo/Vonage
- **Calendar**: Google Calendar integration
- **UI**: Tailwind CSS 4 + shadcn/ui components, Framer Motion
- **Animations**: GSAP + Three.js for 3D effects
- **Logging**: Custom file-based logger with structured logs
- **Monitoring**: Sentry integration for error tracking
- **Analytics**: Vercel Analytics
- **Build Configuration**: Custom Next.js config with security headers, Turbopack, console removal

## Critical File Locations

### Models (MongoDB Schemas)
- `/src/models/Lead.ts` - Lead management with call results tracking
- `/src/models/PhoneProvider.ts` - Multi-tenant phone provider configs (with encryption)
- `/src/models/CalendarConnection.ts` - Calendar integrations
- `/src/models/PendingAppointment.ts` - Appointment booking workflow
- `/src/models/Assistant.ts` - AI assistant configurations and VAPI integration
- `/src/models/CallSummary.ts` - Call data extraction with structured data and stereo recording URLs
- `/src/models/Credit.ts` - Usage-based billing system with transaction tracking
- `/src/models/Admin.ts` - Separate admin authentication system

### Core Services
- `/src/lib/tenantVapi.ts` - **Primary Vapi service** (tenant-specific with phone provider integration, conversation flow optimization)
- `/src/lib/vapi.ts` - Basic Vapi service (simpler, global)
- `/src/lib/mongodb.ts` - Database connection with caching
- `/src/lib/logger.ts` - Structured logging system
- `/src/lib/usageValidator.ts` - Credit-based usage tracking and billing validation
- `/src/lib/csvProcessor.ts` - Lead file processing and validation
- `/src/lib/calendar/` - Calendar provider abstractions

### API Routes Structure
- `/src/app/api/leads/` - Lead CRUD and CSV upload
- `/src/app/api/phone-providers/` - Phone provider management
- `/src/app/api/assistants/` - **AI assistant creation and management**
- `/src/app/api/webhooks/vapi/` - **Core webhook handler** (call status updates, data extraction, stereo recording processing)
- `/src/app/api/calendar/` - Calendar authentication and management
- `/src/app/api/appointments/` - Appointment confirmation/rejection
- `/src/app/api/call-summaries/` - Call data extraction and structured information display
- `/src/app/api/admin/` - Separate admin system with user management and credit adjustments
- `/src/app/api/paypal/` - PayPal payment processing and subscription management

### Key Components
- `/src/components/PromptWizard.tsx` - **10-step AI prompt generation wizard**
- `/src/components/AssistantForm.tsx` - Assistant creation interface with wizard integration
- `/src/components/DashboardClient.tsx` - Main dashboard with getting started flow

### Key Pages
- `/src/app/leads/page.tsx` - **Main lead management interface**
- `/src/app/dashboard/page.tsx` - Enhanced dashboard with assistant management
- `/src/app/settings/page.tsx` - Phone provider and calendar setup
- `/src/app/pricing/page.tsx` - PayPal subscription plans
- `/src/app/blogs/page.tsx` - Blog system with markdown file processing
- `/src/app/admin/` - Admin dashboard for user and system management

## Important Patterns & Conventions

### Authentication Flow
- Uses Clerk middleware in `/src/middleware.ts`
- Protected routes pattern: `/dashboard(.*)` 
- User ID from `auth()` function, not session-based

### Database Patterns
- All models include `userId` field for multi-tenancy
- Pre-save hooks for `updatedAt` timestamps
- Encrypted credentials in PhoneProvider model
- Proper indexing for performance (userId + createdAt, status, etc.)

### Vapi Integration
- **Use TenantVapiService** for new features (not basic VapiService)
- Webhook handling pattern in `/src/app/api/webhooks/vapi/route.ts`
- Lead status flow: `pending → calling → completed/failed`
- Call results stored in nested `callResults` object on Lead model

### Logging System
- Structured logging with operation codes (e.g., 'CSV_UPLOAD_START')
- Context-aware logs with userId, leadId, vapiCallId
- File-based logging with date rotation in `/logs/` directory
- Separate webhook and error log files

### Phone Provider Architecture
- Multi-tenant: each user can have their own Twilio/Plivo/Nexmo credentials
- Credential encryption using crypto module
- Vapi phone number creation via provider APIs
- Validation of phone numbers in provider accounts

### Credit System Architecture
- Credit-based usage tracking for calls and features
- PayPal subscription integration with automatic credit allocation
- Manual credit adjustments through admin system
- Usage validation before expensive operations (calls, CSV uploads)
- Credit transactions logged in `AdminCreditTransaction` model

### Admin System Architecture
- Separate authentication system from user-facing Clerk auth
- JWT-based admin sessions with bcrypt password hashing
- Admin-only routes under `/admin/` with middleware protection
- User management, credit adjustments, and support ticket handling
- System settings management and platform statistics

## Development Commands

```bash
npm run dev          # Next.js development server with Turbopack
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint
npm install          # Install dependencies

# TypeScript checking (manual, no dedicated script)
npx tsc --noEmit      # Type check without output
```

## Environment Variables

**Required for core functionality:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
- `MONGODB_URI`
- `VAPI_API_KEY` / `VAPI_ASSISTANT_ID`
- `PHONE_PROVIDER_ENCRYPTION_KEY` (for credential encryption)

**Optional:**
- PayPal: `NEXT_PUBLIC_PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `NEXT_PUBLIC_PAYPAL_ENVIRONMENT`
- Google Calendar: OAuth credentials
- Sentry: `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN`
- Application: `NEXT_PUBLIC_APP_URL`

## Common Gotchas

1. **Two Vapi Services**: Use `TenantVapiService` for new features - it handles multi-tenant phone providers
2. **Phone Number Format**: Must be E.164 format (e.g., +1234567890)
3. **Lead Status Management**: Don't manually set to 'calling' - let webhook handlers manage state transitions
4. **Logging Context**: Always include userId in log context for multi-tenant debugging
5. **Credential Security**: PhoneProvider model auto-encrypts sensitive fields - access via getters
6. **Database Connection**: Use `connectToDatabase()` in API routes - handles connection caching
7. **TypeScript Configuration**: Build ignores TypeScript errors (`ignoreBuildErrors: true`) and ESLint errors during builds
8. **Admin System**: Separate admin authentication system - don't confuse with user Clerk auth
9. **Call Data Extraction**: Use `generateStructuredDataPrompt` in PromptWizard.tsx to include context for better extraction
10. **Stereo Recording URLs**: Available in call summaries via webhook artifact data (`stereoRecordingUrl` field)
11. **Blog Directory**: Requires `/blogs/` directory at project root with markdown files for build to succeed

## File Upload Patterns

- CSV upload uses `formidable` for file parsing
- CSV processing in `/src/lib/csvProcessor.ts`
- Validation before Lead creation
- Comprehensive error reporting and logging

## UI Components Architecture

- `/src/components/ui/` - shadcn/ui base components
- `/src/components/` - Custom business components
- ConditionalNavbar pattern for auth-based navigation
- Three.js components for landing page animations

## Testing Approach

- **No formal testing framework configured** - manual testing approach
- Phone provider testing via `/src/app/api/phone-providers/[id]/test/`
- Assistant testing via `/src/app/api/assistants/[id]/test/`
- Webhook testing with dedicated logging in `/logs/webhooks-*.log`
- CSV validation with error collection
- Vapi call retry mechanism for failed calls
- Admin system testing routes in `/src/app/api/test-*`

## When Adding New Features

1. **Lead-related**: Extend Lead model, update webhook handlers in `/src/app/api/webhooks/vapi/route.ts`
2. **Phone providers**: Follow encryption pattern in PhoneProvider model
3. **Calendar**: Implement CalendarProvider interface
4. **API routes**: Include proper auth checks, logging, and error handling
5. **UI**: Use existing Tailwind + shadcn/ui pattern with Framer Motion
6. **Logging**: Add structured logging with operation codes
7. **Call data processing**: Update CallSummary model and webhook extraction logic
8. **Credit system**: Extend usage tracking in `usageValidator.ts` for new billable features
9. **Prompt generation**: Enhance PromptWizard.tsx for new data extraction requirements

## Architecture Notes

### Build Configuration
- **Turbopack** enabled for fast development builds
- **Console statements removed** in production via Next.js config
- **Security headers** configured (X-Frame-Options, X-Content-Type-Options)
- **TypeScript/ESLint errors ignored** during builds for deployment flexibility

### Data Flow Patterns
- **Webhook-driven architecture**: Call status managed entirely through Vapi webhooks
- **Structured data extraction**: AI prompts enhanced with business context for better results
- **Multi-tenant isolation**: All data segregated by userId with proper indexing
- **Credit-based billing**: Usage tracked in real-time with overage protection

This is a mature platform with established patterns - follow existing conventions rather than introducing new ones.