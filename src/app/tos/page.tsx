import React from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'

interface TermSectionProps {
  title: string;
  content: string[];
}

const termsContent: TermSectionProps[] = [
  {
    title: '1. Acceptance of Terms',
    content: [
      'By using BIT10, you acknowledge that you have read, understood, and agree to comply with these Terms of Service. These terms apply to all users of the platform, including visitors, registered users, and contributors.',
    ]
  },
  {
    title: '2. Description of Service',
    content: [
      'BIT10 provides a platform that allows users to invest in a tokenized portfolio linked to the performance of cryptocurrencies or Bitcoin native assets. The platform offers tools for managing and tracking digital asset investments.',
    ]
  },
  {
    title: '3. User Registration',
    content: [
      'To access certain features of BIT10, you may be required to create an account. You agree to provide accurate and complete information during the registration process and to update such information to keep it accurate and current.',
    ]
  },
  {
    title: '4. User Conduct',
    content: [
      'Users of BIT10 agree not to engage in any activities that may:',
      'a. Violate any applicable laws or regulations.',
      'b. Infringe on the rights of others.',
      'c. Interfere with or disrupt the functionality of the platform.'
    ]
  },
  {
    title: '5. Privacy',
    content: [
      'Your privacy is important to us. Our Privacy Policy outlines how we collect, use, and safeguard your information. By using BIT10, you consent to the practices described in our Privacy Policy.',
    ]
  },
  {
    title: '6. Security',
    content: [
      'BIT10 employs security measures to protect user accounts and data. Users are responsible for maintaining the confidentiality of their account credentials and agree to notify us immediately of any unauthorized use.',
    ]
  },
  {
    title: '7. Intellectual Property',
    content: [
      'All content and materials on BIT10, including but not limited to logos, designs, and software, are the property of BIT10 and are protected by intellectual property laws.',
    ]
  },
  {
    title: '8. Limitation of Liability',
    content: [
      'BIT10 and its affiliates shall not be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in any way connected with the use of our platform.',
    ]
  },
  {
    title: '9. Changes to Terms',
    content: [
      'BIT10 reserves the right to modify or update these Terms of Service at any time. Users will be notified of significant changes, and continued use of BIT10 constitutes acceptance of the modified terms.',
    ]
  },
  {
    title: '10. Governing Law',
    content: [
      'These Terms of Service are governed by and construed in accordance with the laws of [Your Jurisdiction]. Any disputes arising from these terms will be subject to the exclusive jurisdiction of the courts in [Your Jurisdiction].',
    ]
  }
];

const TermSection: React.FC<TermSectionProps> = ({ title, content }) => (
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
        <h1 className='text-2xl font-semibold leading-tight text-center tracking-wider lg:text-4xl md:whitespace-nowrap'>Terms of Service</h1>
      </div>

      <div className='py-4 w-full'>
        <h1 className='font-semibold text-xl tracking-wide'>Last Updated: 26 December 2023</h1>

        <div className='flex items-center justify-center py-2'>
          <p className='text-lg md:text-xl text-center max-w-5xl'>Welcome to BIT10! Before you proceed, we kindly request that you carefully read and understand our Terms of Service. By accessing or using BIT10, you agree to be bound by the following terms and conditions. If you do not agree with any part of these terms, please refrain from using our services.</p>
        </div>

        <div className='w-full flex flex-col items-start justify-center space-y-4 px-2 md:px-[5vw]'>
          {termsContent.map((section, index) => (
            <TermSection key={index} title={section.title} content={section.content} />
          ))}

          <div className='gap-1'>
            <h1 className='text-xl md:text-2xl font-semibold tracking-wide'>Contact Us</h1>
            <p className='text-lg'>
              If you have any questions or concerns about these Terms of Service, please contact us at{' '}
              <a href='mailto:ziyarabani@gmail.com' className='text-blue-800 dark:text-blue-400 underline cursor-pointer'>
                ziyarabani@gmail.com
              </a>
              .
            </p>
            <p className='text-lg'>Thank you for choosing BIT10. We look forward to providing you with a secure and efficient freelancing experience.</p>
          </div>

        </div>

      </div>
    </MaxWidthWrapper >
  )
}
