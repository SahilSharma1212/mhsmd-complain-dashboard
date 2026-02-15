import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const response = NextResponse.json(
            { message: "Logout successful" },
            { status: 200 }
        );

        response.cookies.set("token", "", {
            httpOnly: true,
            expires: new Date(0),
            path: "/",
        });

        return response;

    } catch (error) {
        return NextResponse.json(
            { message: "Logout failed" },
            { status: 500 }
        );
    }
}
