import React from 'react';
import { Tailwind, Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components';

interface BIT10ContactUsProps {
    email: string;
    name: string;
    message: string;
};

export function BIT10ContactUs({ email, name, message }: BIT10ContactUsProps) {
    return (
        <Html>
            <Head />
            <Preview>Message from BIT10 Contact Us</Preview>
            <Tailwind>
                <Body className='bg-[#f3f3f5] font-dmSans'>
                    <Container className='w-[680px] max-w-full mx-auto'>
                        <Section className='flex py-2'>
                            <Heading className='text-4xl font-bold text-black px-4'>
                                BIT10
                            </Heading>
                        </Section>

                        <Section className='rounded-t-md flex flex-col bg-[#21C45D]'>
                            <Heading className='text-white text-4xl font-bold text-center p-4'>
                                Hello there 👋!
                            </Heading>
                        </Section>

                        <Section className='flex flex-col space-y-4 p-4 bg-white rounded-b-md'>
                            <Heading as='h2' className='m-0 mb-3.5 font-bold text-xl text-[#0c0d0e]'>
                                Message from {name} ({email}) on BIT10 Contact Us page
                            </Heading>

                            <Hr className='my-5' />

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>Email: {email}</Text>
                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>Name: {name}</Text>
                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>Message: {message}</Text>

                            <Hr className='my-5' />

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                This email was sent from the BIT10 Contact Us page. You can reply to this email to send a response to the recipient.
                            </Text>
                        </Section>
                    </Container>

                    <Section className='w-[680px] max-w-full mx-auto mt-4'>
                        <Text className='text-gray-500'>
                            You&apos;re receiving this email because someone contacted you through the BIT10 Contact Us page.
                        </Text>
                    </Section>
                </Body>
            </Tailwind>
        </Html>
    );
};
