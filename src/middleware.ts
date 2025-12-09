import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Rutas públicas (no protegidas)
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/sso-callback(.*)',
  '/api/webhooks(.*)',
  '/api/products(.*)',
]);

// Rutas que requieren autenticación
const isProtectedRoute = createRouteMatcher([
  '/perfil(.*)',
  '/checkout(.*)',
  '/admin(.*)',
]);

export default clerkMiddleware((auth, req) => {
  // Proteger solo rutas específicas que requieren autenticación
  if (isProtectedRoute(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
