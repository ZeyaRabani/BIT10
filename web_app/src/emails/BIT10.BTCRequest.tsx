import React from 'react'
import { Tailwind, Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'

export function BIT10BTCRequest({ email, principalId }: { email: string, principalId: string }) {
    return (
        <Html>
            <Head />
            <Preview>BIT10.BTC token request</Preview>
            <Tailwind>
                <Body className='bg-[#f3f3f5] font-dmSans'>
                    <Container className='w-[680px] max-w-full mx-auto'>
                        <Section className='flex py-2'>
                            <Heading className='text-4xl font-bold text-black px-4'>
                                BIT10
                            </Heading>
                        </Section>

                        <Section className='rounded-t-md flex flex-col bg-[#EA580C]'>
                            <Heading className='text-white text-4xl font-bold text-center p-4'>
                                Hello there 👋!
                            </Heading>
                        </Section>

                        <Section className='flex flex-col space-y-4 p-4 bg-white rounded-b-md'>
                            <Heading as='h2' className='m-0 mb-3.5 font-bold text-xl text-[#0c0d0e]'>
                                Request from {principalId} on BIT10 Faucet page for BIT10.BTC tokens
                            </Heading>

                            <Hr className='my-5' />

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                Email: {email}
                            </Text>

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                Principal ID: {principalId}
                            </Text>

                            <Hr className='my-5' />

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                This email was sent from the BIT10 Faucet page.
                            </Text>

                        </Section>
                    </Container>

                    <Section className='w-[680px] max-w-full mx-auto mt-4'>
                        <Text className='text-gray-500'>
                            You&apos;re receiving this email because someone requested BIT10.BTC tokens on the BIT10 Faucet page.
                        </Text>
                    </Section>
                </Body>
            </Tailwind>
        </Html>
    )
}
