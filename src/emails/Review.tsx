import React from 'react'
import { Tailwind, Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from '@react-email/components'

export function Review() {
    return (
        <Html>
            <Head />
            <Preview> ⭐ We Value Your Feedback! Please Share Your Thoughts</Preview>
            <Tailwind>
                <Body className='bg-[#f3f3f5] font-sansSerif'>
                    <Container className='w-[680px] max-w-full mx-auto'>
                        <Section className='flex p-4'>
                            <Img width='180' src='https://bit10.app/logo/logo-with-name.png' />
                        </Section>

                        <Section className='flex flex-col space-y-4 p-4 bg-white rounded-b-md'>
                            <Heading as='h2' className='m-0 mb-3.5 font-bold text-xl text-[#0c0d0e]'>
                                Hi BIT10 Testnet User,
                            </Heading>

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                I hope this email finds you well. At BIT10, we&apos;re always striving to improve and provide the best experience possible. To help us continue to grow and serve you better, we would greatly appreciate it if you could take a few minutes to share your thoughts with us.
                            </Text>

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                We&apos;ve created a short Google Form where you can provide your feedback and let us know how we&apos;re doing. Your input is incredibly valuable to us, and we&apos;re eager to hear about your experience with BIT10.
                            </Text>

                            <Text className='text-[17px] leading-[17px]'>
                                <Link href='https://forms.gle/hkvBSpwNEjgf1F1L9' className='text-blue-500'>
                                    https://forms.gle/hkvBSpwNEjgf1F1L9
                                </Link>
                            </Text>

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                Thank you for your time and support! Your feedback will help us to continue enhancing our services and meeting your needs.
                            </Text>

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                Best Regards,
                            </Text>
                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                The BIT10 Team
                            </Text>
                        </Section>
                    </Container>

                    <Section className='w-[680px] max-w-full mx-auto'>
                        <Text className='text-gray-500'>
                            You&apos;re receiving this email because you signed up for the BIT10 Testnet.
                        </Text>
                    </Section>
                </Body>
            </Tailwind>
        </Html>
    )
}
