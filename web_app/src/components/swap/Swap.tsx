"use client"

import React from 'react'
import { useWallet } from '@/context/WalletContext'
import { whitelistedPrincipalIds } from '@/actions/dbActions'
import { toast } from 'sonner'
import { useQueries } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import SwapModule from './SwapModule'

interface WhitelistedPrincipal {
  userPrincipalId: string;
}

export default function Swap() {
  const { principalId } = useWallet();

  const fetchWhitelistedPrincipalIds = async () => {
    try {
      const result = await whitelistedPrincipalIds();
      return result;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('An error occurred while fetching whitelisted users. Please try again!');
      return [];
    }
  };

  const gatedMainnetAccess = useQueries({
    queries: [
      {
        queryKey: ['whitelistedUserPrincipalIds'],
        queryFn: () => fetchWhitelistedPrincipalIds(),
      }
    ],
  });

  const isLoading = gatedMainnetAccess.some(query => query.isLoading);
  const whitelistedPrincipal = gatedMainnetAccess[0]?.data ?? [];

  const isApproved = (whitelistedPrincipal as WhitelistedPrincipal[]).some(
    (item) => item.userPrincipalId === principalId
  );

  return (
    <div>
      {isLoading ? (
        <div className='animate-fade-bottom-up flex items-center justify-center w-full min-h-[60vh]'>
          <Card className='w-96 px-2 pt-6 animate-fade-bottom-up'>
            <CardContent className='flex flex-col space-y-2'>
              <Skeleton className='h-56' />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>{isApproved ?
          <SwapModule /> : (
            <div className='animate-fade-bottom-up flex items-center justify-center w-full min-h-[60vh]'>
              <Card className='w-full md:max-w-96 py-8'>
                <CardHeader>
                  <CardTitle className='text-center tracking-wide'>Access Restricted</CardTitle>
                </CardHeader>
                <CardContent className='text-center flex flex-col space-y-2'>
                  <p>The Swap page is gated for mainnet access. Your Principal ID needs to be approved first to use the Swap feature.</p>
                  <p>For access, please contact <a href='https://x.com/bit10startup' className='text-primary underline'>@bit10startup</a> on Twitter/X.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
