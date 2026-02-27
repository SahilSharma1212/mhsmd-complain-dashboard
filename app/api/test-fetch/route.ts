import { NextResponse } from "next/server";

export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    try {
        const res = await fetch(`${url}/rest/v1/complaints?select=id&limit=1`, {
            headers: {
                "apikey": key!,
                "Authorization": `Bearer ${key}`
            }
        });

        if (!res.ok) {
            const text = await res.text();
            return NextResponse.json({
                success: false,
                status: res.status,
                error: text,
                env: { url: !!url, key: !!key }
            });
        }

        const data = await res.json();
        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        return NextResponse.json({
            success: false,
            error: e.message,
            stack: e.stack,
            env: { url: !!url, key: !!key }
        });
    }
}
