/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    // @ts-ignore
    const country = req.geo?.country ?? req.headers.get('x-vercel-ip-country');

    if (country === 'US') {
        return NextResponse.redirect(new URL('/not-for-us', req.url));
    }

    return res;
}

export const config = {
    matcher: ['/', '/((?!_next|_vercel|.*\\..*|api|api-route|ingest|static).*)'],
};
