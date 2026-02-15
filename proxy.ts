import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function proxy(request: NextRequest) {
    const token = request.cookies.get("token")?.value;

    // Allow public routes
    if (
        request.nextUrl.pathname.startsWith("/sign-in") ||
        request.nextUrl.pathname.startsWith("/api")
    ) {
        return NextResponse.next();
    }

    // No token → redirect
    if (!token) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    try {
        // Just verify validity
        jwt.verify(token, process.env.JWT_SECRET!);
        return NextResponse.next();
    } catch {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }
}
