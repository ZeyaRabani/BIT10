import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const url = request.nextUrl
    const referralCode = url.searchParams.get('referral')

    if (referralCode) {
        const response = NextResponse.next()
        response.cookies.set('referral', referralCode)
        return response
    }

    return NextResponse.next()
}
