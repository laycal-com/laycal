/**
 * Outbound destinations used by the marketing site.
 *
 * Access to the product is invite-only: accounts are created by sending a Clerk
 * invitation from the Clerk dashboard. Nothing public should link to /sign-up —
 * that route exists solely so Clerk invitation tickets have somewhere to land.
 * Every acquisition CTA points at DEMO_URL instead.
 */
export const DEMO_URL = 'https://calendly.com/ceo-laycal/demo-laycal';
