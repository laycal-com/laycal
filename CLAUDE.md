# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **SaaS template** built as a **lead calling platform** using AI voice agents through Vapi integration. It's NOT a generic SaaS template despite the name - it's specifically designed for automated outbound calling to sales leads.

**Core Business Logic**: Upload CSV of leads → AI voice agent calls each lead → Track call results and appointments → Calendar integration for booking follow-ups.

## Key Technologies & Architecture

- **Framework**: Next.js 15 with TypeScript, App Router
- **Authentication**: Clerk (not NextAuth)
- **Database**: MongoDB with Mongoose ODM
- **Payments**: PayPal integration (not Stripe)
- **AI Voice**: Vapi.ai for outbound calling
- **Phone Providers**: Multi-tenant support for Twilio, Plivo, Nexmo/Vonage
- **Calendar**: Google Calendar integration
- **UI**: Tailwind CSS + shadcn/ui components
- **Animations**: GSAP + Three.js for 3D effects
- **Logging**: Custom file-based logger with structured logs

## Critical File Locations

### Models (MongoDB Schemas)
- `/src/models/Lead.ts` - Lead management with call results tracking
- `/src/models/PhoneProvider.ts` - Multi-tenant phone provider configs (with encryption)
- `/src/models/CalendarConnection.ts` - Calendar integrations
- `/src/models/PendingAppointment.ts` - Appointment booking workflow

### Core Services
- `/src/lib/tenantVapi.ts` - **Primary Vapi service** (tenant-specific with phone provider integration)
- `/src/lib/vapi.ts` - Basic Vapi service (simpler, global)
- `/src/lib/mongodb.ts` - Database connection with caching
- `/src/lib/logger.ts` - Structured logging system
- `/src/lib/calendar/` - Calendar provider abstractions

### API Routes Structure
- `/src/app/api/leads/` - Lead CRUD and CSV upload
- `/src/app/api/phone-providers/` - Phone provider management
- `/src/app/api/webhooks/vapi/` - Vapi webhook handler (call status updates)
- `/src/app/api/calendar/` - Calendar authentication and management
- `/src/app/api/appointments/` - Appointment confirmation/rejection

### Key Pages
- `/src/app/leads/page.tsx` - **Main lead management interface**
- `/src/app/dashboard/page.tsx` - Basic dashboard (static content)
- `/src/app/settings/page.tsx` - Phone provider and calendar setup
- `/src/app/pricing/page.tsx` - PayPal subscription plans

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

## Development Commands

```bash
npm run dev          # Next.js development server with Turbopack
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint
```

## Environment Variables

**Required for core functionality:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
- `MONGODB_URI`
- `VAPI_API_KEY` / `VAPI_ASSISTANT_ID`
- `PHONE_PROVIDER_ENCRYPTION_KEY` (for credential encryption)

**Optional:**
- PayPal: `NEXT_PUBLIC_PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`
- Google Calendar: OAuth credentials

## Common Gotchas

1. **Two Vapi Services**: Use `TenantVapiService` for new features - it handles multi-tenant phone providers
2. **Phone Number Format**: Must be E.164 format (e.g., +1234567890)
3. **Lead Status Management**: Don't manually set to 'calling' - let webhook handlers manage state transitions
4. **Logging Context**: Always include userId in log context for multi-tenant debugging
5. **Credential Security**: PhoneProvider model auto-encrypts sensitive fields - access via getters
6. **Database Connection**: Use `connectToDatabase()` in API routes - handles connection caching

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

- Phone provider testing via `/src/app/api/phone-providers/[id]/test/`
- Webhook testing with dedicated logging
- CSV validation with error collection
- Vapi call retry mechanism for failed calls

## When Adding New Features

1. **Lead-related**: Extend Lead model, update webhook handlers
2. **Phone providers**: Follow encryption pattern in PhoneProvider model
3. **Calendar**: Implement CalendarProvider interface
4. **API routes**: Include proper auth checks, logging, and error handling
5. **UI**: Use existing Tailwind + shadcn/ui pattern
6. **Logging**: Add structured logging with operation codes

This is a mature platform with established patterns - follow existing conventions rather than introducing new ones.