"use server"

import { db } from '@/server/db'
import { bit10Comparison } from '@/server/db/schema'

export const bit10PreformaceComparisonData = async () => {
    try {
        const data = await db.select({
            date: bit10Comparison.date,
            bit10Top: bit10Comparison.bit10Top,
            btc: bit10Comparison.btc,
            sp500: bit10Comparison.sp500
        })
            .from(bit10Comparison)
            .orderBy(bit10Comparison.date);
        return data;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return 'Error fetching BIT10 Preformace Comparison Data';
    }
}
