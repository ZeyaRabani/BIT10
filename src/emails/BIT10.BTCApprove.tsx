import React from 'react'
import { Tailwind, Body, Container, Head, Html, Preview, Section, Text, Img, Link } from '@react-email/components'

export function BIT10BTCApprove({ email, principalId }: { email: string, principalId: string }) {
    return (
        <Html>
            <Head />
            <Preview>BIT10.BTC token request approved</Preview>
            <Tailwind>
                <Body className='bg-[#f3f3f5] font-sansSerif pt-4'>
                    <Container className='w-[680px] max-w-full mx-auto bg-white rounded-md'>
                        <Section className='flex items-center justify-center p-4'>
                            <Img width={114} src='https://bit10.app/logo/logo-with-name.png' />
                        </Section>
                        <Section className='flex flex-col px-4 py-2 text-[#0c0d0e]'>
                            <Text className='text-[17px] leading-6'>Hi {email},</Text>
                            <Text className='text-[17px] leading-6'>
                                Your request for BIT10.BTC tokens for Principal ID: {principalId} on the BIT10 app has been approved. We have sent you 0.000168 BIT10.BTC tokens for buying BIT10.DEFI tokens and testing our app. If you encounter any issues or have questions, please don&apos;t hesitate to reach out to {''}
                                <Link href='https://x.com/zeyathezeya' className='text-blue-500'>
                                    @zeyathezeya
                                </Link> or {''}
                                <Link href='https://x.com/Harshal_0902' className='text-blue-500'>
                                    @Harshal_0902
                                </Link> {''}
                                for support.
                            </Text>

                            <Text className='text-[17px] leading-6'>
                                Best Regards,
                                <br />
                                The BIT10 Team
                            </Text>
                        </Section>
                    </Container>

                    <Section className='w-[680px] max-w-full mx-auto'>
                        <Text className='text-gray-500'>
                            You&apos;re receiving this email because you requested BIT10.BTC tokens on the BIT10 Faucet page.
                        </Text>
                    </Section>
                </Body>
            </Tailwind>
        </Html>
    )
}
