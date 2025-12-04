import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Rutas públicas que no requieren autenticación de Clerk
// Admin usa su propio sistema de autenticación local
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/perfil(.*)',
  '/checkout(.*)',
  '/api/(.*)',
  '/sso-callback(.*)',
  '/admin(.*)', // Admin usa autenticación local, no Clerk
]);

export default clerkMiddleware(async (auth, req) => {
  // No proteger ninguna ruta con Clerk por ahora
  // Admin maneja su propia autenticación con useAdminAuthStore
  // Perfil y checkout manejan autenticación local con useAuthStore
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
