import React from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'

interface PrivacySectionProps {
  title: string;
  content: string[];
}

const privacyContent: PrivacySectionProps[] = [
  {
    title: '1. Information We Collect',
    content: [
      'a. Personal Information',
      'We may collect personal information that you provide when using BIT10, such as:',
      '- Contact information (e.g., name, email address).',
      '- Account credentials (e.g., username, password).',
      '- Payment information (if applicable).',
      'Any other information you choose to provide.',
      'b. Usage Data',
      'We may collect information about how you interact with BIT10, including:',
      '- Log data (e.g., IP address, browser type).',
      '- Device information (e.g., device type, operating system).',
      '- Usage patterns and preferences.'
    ]
  },
  {
    title: '2. How We Use Your Information',
    content: [
      'We may use your personal information for the following purposes:',
      '- To provide and maintain BIT10.',
      '- To personalize your experience on the platform.',
      '- To process transactions (if applicable).',
      '- To send you important updates and communications.',
      '- To improve our services and address user feedback.'
    ]
  },
  {
    title: '3. Data Security',
    content: [
      'We implement reasonable security measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the internet or electronic storage is entirely secure, and we cannot guarantee absolute security.'
    ]
  },
  {
    title: '4. Sharing Your Information',
    content: [
      'We may share your personal information with third parties only in the following circumstances:',
      '- With your consent.',
      '- To comply with legal obligations.',
      '- To protect and defend our rights and property',
      'In connection with a business transaction (e.g., merger, acquisition).'
    ]
  },
  {
    title: '5. Cookies and Similar Technologies',
    content: [
      'BIT10 may use cookies and similar technologies to enhance user experience and gather information about usage patterns. You can manage your cookie preferences through your browser settings.'
    ]
  },
  {
    title: '6. Third-Party Links',
    content: [
      'BIT10 may contain links to third-party websites. We are not responsible for the privacy practices of these websites. Please review the privacy policies of third-party sites before providing any personal information.'
    ]
  },
  {
    title: '7. Children\'s Privacy',
    content: [
      'BIT10 is not intended for use by individuals under the age of 13. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us, and we will take steps to delete such information.'
    ]
  },
  {
    title: '8. Changes to the Privacy Policy',
    content: [
      'We reserve the right to update and modify this Privacy Policy. Any changes will be effective immediately upon posting the revised policy on BIT10. We recommend reviewing this page periodically for updates.'
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
        <h1 className='font-semibold text-xl tracking-wide'>Last Updated: 26 December 2023</h1>

        <div className='flex items-center justify-center py-2'>
          <p className='text-lg md:text-xl text-center max-w-5xl'>Welcome to BIT10! This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our services. By accessing or using BIT10, you agree to the terms outlined in this Privacy Policy.</p>
        </div>

        <div className='w-full flex flex-col items-start justify-center space-y-4 px-2 md:px-[5vw]'>
          {privacyContent.map((section, index) => (
            <PrivacySection key={index} title={section.title} content={section.content} />
          ))}

          <div className='gap-1'>
            <h1 className='text-xl md:text-2xl font-semibold tracking-wide'>9. Use of Google Analytics</h1>
            <p className='text-lg'>a. We use Google Analytics in an anonymous and aggregate manner.</p>
            <p className='text-lg'>b. No personally identifiable information about individual users is collected.</p>
            <p className='text-lg'>c. Google Analytics collects data such as page views, session duration, and user interactions.</p>
            <p className='text-lg'>d. This information helps us analyze user interactions and improve our platform.</p>
            <p className='text-lg'>e. For more details, refer to Google Analytics <a href='https://policies.google.com/terms' target='_blank' className='underline'>Terms of Service</a> and <a href='https://policies.google.com/privacy' target='_blank' className='underline'>Privacy Policy</a>.</p>
            <p className='text-lg'>f. To learn more about how Google uses information from sites or apps that use their services, please visit <a href='https://policies.google.com/technologies/partner-sites' target='_blank' className='underline'>How Google uses information</a>.</p>
          </div>

          <div className='gap-1'>
            <h1 className='text-xl md:text-2xl font-semibold tracking-wide'>Contact Us</h1>
            <p className='text-lg'>
              If you have any questions or concerns about this Privacy Policy, please contact us at{' '}
              <a href='mailto:ziyarabani@gmail.com' className='text-blue-800 dark:text-blue-400 underline cursor-pointer'>
                ziyarabani@gmail.com
              </a>
              .
            </p>
            <p className='text-lg'>Thank you for trusting BIT10 with your information. We are committed to protecting your privacy and providing you with a secure freelancing experience.</p>
          </div>

        </div>

      </div>
    </MaxWidthWrapper >
  )
}
