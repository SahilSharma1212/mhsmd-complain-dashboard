import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Exclude static assets and public paths from middleware logic
    if (
        pathname.startsWith('/_next') || // Next.js internals
        pathname.startsWith('/api') || // API routes
        pathname.startsWith('/static') || // static files
        pathname.startsWith('/sign-in') || // Public sign-in page
        pathname.includes('.') // Files with extensions (css, js, images, etc.)
    ) {
        return NextResponse.next()
    }

    // 2. Auth Check
    const token = request.cookies.get('token')?.value

    if (!token) {
        // If no token, redirect to sign-in
        const url = request.nextUrl.clone()
        url.pathname = '/sign-in'
        return NextResponse.redirect(url)
    }

    // Note: Actual JWT verification with 'jsonwebtoken' is not supported in Edge Runtime.
    // Ideally, use 'jose' for Edge-compatible JWT verification, or verify in API routes/Server Components.
    // For now, we just check if the token exists to protect routes.

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
