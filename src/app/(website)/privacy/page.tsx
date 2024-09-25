import React from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'

interface PrivacySectionProps {
    title: string;
    content: string[];
}

const privacyContent: PrivacySectionProps[] = [
    {
        title: '',
        content: [
            'This Privacy Policy explains how BIT10 and any of its affiliates or subsidiaries (collectively, "BIT10", "we", "our" or "us") collect, use, and discloses personal data or other information about you ("Personal Information") - the User - collected through BIT10\'s Marketing and App Site (the "Website"), and the features, content, applications, or services we provide (collectively with the Website, the "Services"). We encourage you to read the Privacy Policy carefully. When you use the Services, you are consenting to the collection, transfer, storage, disclosure, and other uses of your information as described in this Privacy Policy.',
            'We collect your Personal Information to provide, maintain, and improve our Services. To be more specific, we primarily use your Personal Information to:',
            '- Communicate with you about our products, services, technical updates, and any information that you request through the Services or that we think you might be interested in.',
            '- Track and analyze activities, usage, trends, numbers, and user insights related to our Services.',
            '- Detect, prevent, and repair technical or security issues.',
            '- Prevent illegal activities and protect the rights and property of BIT10 and the users.',
            '- Facilitate our work with vendors, agents, consultants, and other relevant service providers.'
        ]
    },
    {
        title: 'Information Collection',
        content: [
            'We collect information you directly share with us (information you choose to share). When you use any interactive features of the Services, or communicate with us in other ways, you choose to provide the information to us.',
            'When you use our Services, we collect log information including your IP address, browser type, time of visit, pages viewed, and any other log information typically shared through interacting with websites. We also obtain information about the device you use to access our Services, including operating system, model of the computer or mobile device, mobile network, and any other information about your device.',
            'If you subscribe to our newsletter with your email address, we may from time to time communicate news, updates, promotional information, marketing materials and other information related to BIT10, and the Services. If you want to opt out of receiving such emails from us, you can opt out by clicking "unsubscribe" in any of the emails we send you.',
            'Cookies are small data files stored on your computer\'s hard drive by websites that you visit. Our Site is using Cookies, which help us understand trends and quality of visits. We use information collected by Cookies to enhance the effectiveness of our Services and improve your experience.',
            'If you subscribe to our newsletter with your email address, we may from time to time communicate news, updates, promotional information, marketing materials and other information related to BIT10, and the Services. If you want to opt out of receiving such emails from us, you can opt out by clicking "unsubscribe" in any of the emails we sent you.',
            'We may also collect and store information that you share with us through email, including inquiries, requests, feedback, and any other information you choose to provide.',
            'We also use plugins from social networks such as LinkedIn, Twitter/X, Discord, Instagram, YouTube on the Site. When you click on a plugin, the associated social network may collect your data, including the data of your visits on the Site, in accordance with their respective privacy policies. We are not responsible for data collected by these social networks. Please check with these social networks on their privacy policies.',
            'Information Collected From Other Sources: We may receive information from other sources, including third party service providers. This helps us evaluate and improve our Services.'
        ]
    },
    {
        title: 'Information Sharing',
        content: [
            'We may share your Personal Information with third parties including vendors, marketing agencies, consultants, agents, or other service providers if such sharing is necessary to facilitate our work with the third parties.',
            'We may also share your Personal Information as we reasonably believe is necessary to:',
            '- Comply with any applicable law, regulation, or valid directive from law enforcement or a court',
            '- Detect, prevent or address any security or technical issues',
            '- Enforce this Privacy Policy, or Terms of Service',
            '- Protect rights, property or safety of BIT10 or others',
            'We have the right to share your Personal Information between and among BIT10 (current and future) parents, subsidiaries or any other affiliates. You acknowledge that in cases where we may choose to sell or transfer our business assets, your Personal Information may be transferred or acquired by a third party, and that any acquirer of our assets may continue to use your Personal Information as provided in this Privacy Policy.'
        ]
    },
    {
        title: 'Rights',
        content: [
            'You have the right to obtain from us a copy of your Personal Information that we collected. You may also update, rectify, or delete your Personal Information anytime, by emailing us at ziyarabani@gmail.com.',
            'However, we may keep the cached or archived information for a period of time.',
            'You may also stop us from sharing your Personal Information with third party service providers, including marketing agencies, by sending us a request at ziyarabani@gmail.com.'
        ]
    },
    {
        title: 'Information Security & Retention',
        content: [
            'We are making reasonable efforts to protect your Personal Information. While we are continuously improving our security measures, we cannot guarantee the security of your Personal Information. You should be aware that unauthorized entry or use, technical system failures, and other factors, may jeopardize your Personal Information.',
            'We store your Personal Information only for the period necessary for the purpose(s) for which we originally collect the information, or as required by applicable laws',
            'We process and store your information in the E.U. However, we and our service providers may transfer your Personal Information to, or store it in, foreign countries. We will make efforts to ensure that we comply with local legal requirements and that your information receives adequate protection in foreign jurisdictions.'
        ]
    },
    {
        title: 'Updates to the Privacy Policy',
        content: [
            'We may amend this Privacy Policy at any time by posting the amended version on the Services including the date of the amendment. If we make changes, we will provide you with notice of such changes by updating the date at the top of this Agreement. Your use of the Services after any changes to the Privacy Policy constitutes your consent to the changes and you are bound by the amended Privacy Policy.'
        ]
    }
]

const PrivacySection: React.FC<PrivacySectionProps> = ({ title, content }) => (
    <div className='gap-1'>
        <h1 className='text-xl md:text-2xl font-semibold tracking-wide'>{title}</h1>
        {content.map((paragraph, index) => (
            <p key={index} className='text-lg'>
                {paragraph}
            </p>
        ))}
    </div>
);

export default function Page() {

    return (
        <MaxWidthWrapper>
            <div className='flex items-center justify-center space-x-2 py-4 max-w-[100vw]'>
                <h1 className='text-2xl font-semibold leading-tight text-center tracking-wider lg:text-4xl md:whitespace-nowrap'>Privacy Policy</h1>
            </div>

            <div className='py-4 w-full'>
                <h1 className='font-semibold text-xl tracking-wide'>Last Updated: 24 September 2024</h1>

                <div className='flex items-center justify-center py-2'>
                    <p className='text-lg md:text-xl text-center max-w-5xl'>Welcome to BIT10! This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our services. By accessing or using BIT10, you agree to the terms outlined in this Privacy Policy.</p>
                </div>

                <div className='w-full flex flex-col items-start justify-center space-y-4 px-2 md:px-[5vw]'>
                    {privacyContent.map((section, index) => (
                        <PrivacySection key={index} title={section.title} content={section.content} />
                    ))}

                    <div className='gap-1'>
                        <h1 className='text-xl md:text-2xl font-semibold tracking-wide'>Contact Us</h1>
                        <p className='text-lg'>
                            If you have any questions or concerns about this Privacy Policy, please contact us at{' '}
                            <a href='mailto:ziyarabani@gmail.com' className='text-blue-800 dark:text-blue-400 underline cursor-pointer'>
                                ziyarabani@gmail.com
                            </a>
                            .
                        </p>
                        <p className='text-lg'>Thank you for choosing BIT10. We look forward to providing you with a secure and efficient financing experience.</p>
                    </div>

                </div>
            </div>
        </MaxWidthWrapper >
    )
}
