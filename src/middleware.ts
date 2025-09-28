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
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  // Handle protected routes
  if (isProtectedRoute(req)) {
    await auth.protect();
    
    // If user is authenticated and trying to access protected routes,
    // check if they need to select a plan
    if (userId && !isPlanSelectionRoute(req) && !isPublicRoute(req)) {
      try {
        // Check if user has a plan selected
        const { connectToDatabase } = await import('@/lib/mongodb');
        const Subscription = (await import('@/models/Subscription')).default;
        
        await connectToDatabase();
        const subscription = await Subscription.findOne({ userId }).lean();
        
        // If no subscription or plan type is 'none', redirect to plan selection
        if (!subscription || subscription.planType === 'none') {
          const selectPlanUrl = new URL('/select-plan', req.url);
          return NextResponse.redirect(selectPlanUrl);
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