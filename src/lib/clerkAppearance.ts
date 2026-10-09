/**
 * Clerk theming, shared by the provider and the auth pages.
 *
 * Values are plain CSS rather than Tailwind classes on purpose: Clerk injects
 * unlayered styles, and those outrank Tailwind's layered utilities.
 */

const BRAND = '#2d6aff';

/** Applied app-wide, so the user menu and profile modal match the dark portal. */
export const clerkAppearance = {
  variables: {
    colorPrimary: BRAND,
    colorBackground: '#0a0a0a',
    colorText: '#fafafa',
    colorTextSecondary: '#a3a3a3',
    colorTextOnPrimaryBackground: '#ffffff',
    colorInputBackground: 'rgba(255, 255, 255, 0.04)',
    colorInputText: '#fafafa',
    colorNeutral: '#ffffff',
    colorDanger: '#ef4444',
    colorSuccess: '#22c55e',
    colorWarning: '#f59e0b',
    borderRadius: '0.625rem',
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    fontSize: '0.9375rem',
  },
} as const;

/**
 * Extra rules for the sign-in and invitation pages, where the form sits
 * directly on the page instead of inside Clerk's own card.
 */
export const authFormAppearance = {
  elements: {
    rootBox: { width: '100%' },
    cardBox: { width: '100%', maxWidth: '100%', boxShadow: 'none', borderRadius: 0 },
    card: { background: 'transparent', boxShadow: 'none', border: 'none', padding: '1px', gap: '1.5rem' },
    // The page supplies its own headline.
    header: { display: 'none' },
    footer: { background: 'transparent', marginTop: '1.5rem' },
    // Access is invite-only, so neither page offers a route to the other.
    footerAction: { display: 'none' },
    formFieldInput: { height: '2.75rem', borderColor: 'rgba(255, 255, 255, 0.12)' },
    formButtonPrimary: {
      height: '2.75rem',
      borderRadius: '9999px',
      fontSize: '0.9375rem',
      fontWeight: 500,
      textTransform: 'none',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.25)',
    },
    socialButtonsBlockButton: { height: '2.75rem', borderColor: 'rgba(255, 255, 255, 0.12)' },
    dividerLine: { background: 'rgba(255, 255, 255, 0.08)' },
  },
} as const;
