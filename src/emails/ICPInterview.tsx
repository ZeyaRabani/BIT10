import React from 'react'
import { Tailwind, Body, Container, Head, Html, Img, Link, Preview, Section, Text } from '@react-email/components'

export function ICPInterview({ name }: { name: string }) {
    return (
        <Html>
            <Head />
            <Preview>🙏 Thank you for interviewing us!</Preview>
            <Tailwind>
                <Body className='bg-[#f3f3f5] font-sansSerif pt-4'>
                    <Container className='w-[680px] max-w-full mx-auto bg-white rounded-md'>
                        <Section className='flex items-center justify-center p-4'>
                            <Img width={114} src='https://bit10.app/logo/logo-with-name.png' />
                        </Section>
                        <Section className='flex flex-col px-4 py-2 text-[#0c0d0e]'>
                            <Text className='text-[17px] leading-6'>Hi {name},</Text>
                            <Text className='text-[17px] leading-6'>I hope this email finds you well.</Text>
                            <Text className='text-[17px] leading-6'>
                                We recently had the pleasure of interviewing with your team for the Developer Grant Interview at ICP. We want to express our sincere gratitude for the opportunity to discuss our project and vision with you.
                            </Text>
                            <Text className='text-[17px] leading-6'>
                                As a follow-up, we have prepared a brief demo of our app to provide a more detailed view of its features and capabilities. You can watch the demo by clicking on the link below:
                            </Text>
                            <Link href='https://youtu.be/q-ztce2YfTI?si=QdKeQDjW0Am5ieKv' target='_blank' rel='noopener noreferrer'>
                                {/* <Img src='/assets/email/swap.png' alt='YouTube Video Thumbnail' width='600' className='rounded' /> */}
                                <Img src='https://bit10.app/assets/email/swap.png' alt='YouTube Video Thumbnail' width='600' className='rounded' />
                            </Link>
                            <Link href='https://youtu.be/q-ztce2YfTI?si=QdKeQDjW0Am5ieKv' target='_blank' rel='noopener noreferrer'>
                                <Text className='text-[17px] leading-6 text-center text-blue-500 underline'>
                                    BIT10 app demo video
                                </Text>
                            </Link>
                            <Text className='text-[17px] leading-6'>
                                If you encounter any issues or have questions, please don&apos;t hesitate to reach out to {''}
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
                            You&apos;re receiving this email because you recently interviewed with us for the Developer Grant Interview (BIT10).
                        </Text>
                    </Section>
                </Body>
            </Tailwind>
        </Html>
    )
}
