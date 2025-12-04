import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Rutas protegidas por Clerk (solo admin por ahora, ya que usamos auth local para perfil)
const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
]);

// Rutas públicas que no requieren autenticación de Clerk
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/perfil(.*)',
  '/checkout(.*)',
  '/api/(.*)',
  '/sso-callback(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Solo proteger rutas de admin con Clerk
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  // El resto de rutas (incluyendo /perfil) manejan su propia autenticación local
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
