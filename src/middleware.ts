import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/support(.*)",
  "/api/protected(.*)",
]);

const isPlanSelectionRoute = createRouteMatcher([
  "/select-plan",
]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing",
  "/contact",
  "/api/webhooks(.*)",
  "/api/pricing",
  "/api/paypal(.*)",
  "/api/user/select-plan",
  "/api/support(.*)",
  "/api/subscription-check",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  // Handle protected routes
  if (isProtectedRoute(req)) {
    await auth.protect();
    
    // If user is authenticated and trying to access protected routes,
    // check if they need to select a plan by making an API call instead of direct DB access
    if (userId && !isPlanSelectionRoute(req) && !isPublicRoute(req)) {
      try {
        // Make internal API call to check subscription status
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
          : req.nextUrl.origin;
        
        const response = await fetch(`${baseUrl}/api/subscription-check`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userId}`,
            'X-Middleware-Check': 'true'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // If no subscription or plan type is 'none', redirect to plan selection
          if (!data.hasValidPlan) {
            const selectPlanUrl = new URL('/select-plan', req.url);
            return NextResponse.redirect(selectPlanUrl);
          }
        }
      } catch (error) {
        console.error('Middleware plan check error:', error);
        // If there's an error, let the request proceed to avoid blocking the user
      }
    }
  }
  
  // Handle plan selection route
  if (isPlanSelectionRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};