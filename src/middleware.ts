import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Signed-in areas. Everything else (marketing pages, auth pages, webhooks and
 * the Vapi tool endpoints, which authorise on the assistant id) is public.
 *
 * Which account a person belongs to, and whether they have finished
 * onboarding, is decided in lib/account and the portal shell, not here.
 */
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/leads(.*)",
  "/call-summary(.*)",
  "/appointments(.*)",
  "/assistants(.*)",
  "/integrations(.*)",
  "/settings(.*)",
  "/support(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
