"use server";

import { db } from '@/server/db';
import { userSignups, walletAllocations } from '@/server/db/schema';

export const addUserSignUps = async ({ email }: { email: string }) => {
    try {
        const newSignUpUser = await db.insert(userSignups).values({ email });
        return newSignUpUser;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return 'Error adding user to signups';
    }
};

export const bit10WalletAllocation = async () => {
    try {
        const data = await db.select().from(walletAllocations);
        return data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return 'Error fetching wallet allocations';
    }
};
