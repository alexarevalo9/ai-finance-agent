// Middleware for Supabase Auth
// Currently not needed as auth is handled client-side with AuthProvider
// Uncomment and configure if you need server-side auth protection

import { NextResponse } from 'next/server';

// Simple middleware that does nothing but satisfies Next.js requirements
export default function middleware() {
  return NextResponse.next();
}

// Uncomment below for actual Supabase server-side auth middleware:
// import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
//
// export async function middleware(req: NextRequest) {
//   const res = NextResponse.next();
//   const supabase = createMiddlewareClient({ req, res });
//   await supabase.auth.getSession();
//   return res;
// }

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
