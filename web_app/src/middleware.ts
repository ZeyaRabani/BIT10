import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { env } from './env'

export default async function middleware(req: NextRequest) {
    const referralCode = req.nextUrl.searchParams.get('referral')
    if (referralCode) {
        const referralResponse = NextResponse.next()
        referralResponse.cookies.set('referral', referralCode)
        return referralResponse
    }

    const res = NextResponse.next();
    const nodeEnv = env.NODE_ENV;
    const pathname = req.nextUrl.pathname;

    if (nodeEnv !== 'development' && pathname !== '/not-for-us') {
        const geo = (req as NextRequest & { geo: { country: string } }).geo;
        const country = geo?.country ?? req.headers.get('x-vercel-ip-country')
        if (['US'].includes(country ?? '')) {
            return NextResponse.redirect(new URL('/not-for-us', req.url))
        }
    }
    return res;
}

export const config = {
    matcher: ['/swap'],
};
