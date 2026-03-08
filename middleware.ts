import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const token = request.cookies.get('token')?.value

    /* ---------- 1. Allow public routes ---------- */
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') ||
        pathname === '/sign-in' ||
        pathname === '/no-login-complaint'
    ) {
        // But prevent logged-in users from visiting /sign-in
        if (pathname === '/sign-in' && token) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        return NextResponse.next()
    }

    /* ---------- 2. Protect private routes ---------- */
    if (!token) {
        const url = request.nextUrl.clone()
        url.pathname = '/sign-in'
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
