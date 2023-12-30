import React from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'

interface RegulatoryComplianceProps {
  title: string;
  content: string[];
}

const privacyContent: RegulatoryComplianceProps[] = [
  {
    title: '1. Introduction',
    content: [
      'C10 is committed to adhering to applicable regulations to create a secure and legal investment environment. This page outlines our approach to regulatory compliance and provides information about the measures we take to ensure compliance with relevant laws.'
    ]
  },
  {
    title: '2. Legal Structure',
    content: [
      'C10 operates under the legal structure of [Your Legal Entity]. This legal entity is subject to the laws and regulations of the jurisdiction in which it is established.'
    ]
  },
  {
    title: '3. Anti-Money Laundering (AML) and Know Your Customer (KYC) Policies',
    content: [
      'To prevent illegal activities, C10 has implemented robust Anti-Money Laundering (AML) and Know Your Customer (KYC) policies. Users may be required to verify their identity through a secure and confidential process.'
    ]
  },
  {
    title: '4. Data Protection and Privacy',
    content: [
      'We are committed to protecting the privacy and security of user data. Our Privacy Policy outlines how we collect, use, and safeguard personal information in compliance with relevant data protection laws.'
    ]
  },
  {
    title: '5. Compliance with Financial Regulations',
    content: [
      'C10 complies with all relevant financial regulations, including but not limited to [List Specific Regulations]. We work closely with regulatory authorities to ensure our operations align with industry standards and legal requirements.'
    ]
  },
  {
    title: '6. Transaction Reporting',
    content: [
      'To maintain transparency and fulfill regulatory obligations, C10 may be required to report certain transactions to regulatory authorities. Users will be informed of any such reporting in accordance with applicable laws.'
    ]
  },
  {
    title: '7. Legal Disclaimer',
    content: [
      'While we strive to maintain compliance with regulations, the cryptocurrency and blockchain industry is subject to rapid changes in regulatory frameworks. C10 reserves the right to adapt its practices to remain in compliance with evolving legal requirements.'
    ]
  },
  {
    title: '8. User Responsibilities',
    content: [
      'Users of C10 are responsible for ensuring their compliance with local laws and regulations related to cryptocurrency investments. C10 does not provide legal or financial advice, and users should seek professional advice if they have concerns about legal compliance.'
    ]
  }
]

const RegulatoryCompliance: React.FC<RegulatoryComplianceProps> = ({ title, content }) => (
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
        <h1 className='text-2xl font-semibold leading-tight text-center tracking-wider lg:text-4xl md:whitespace-nowrap'>Regulatory Compliance</h1>
      </div>

      <div className='py-4 w-full'>
        <h1 className='font-semibold text-xl tracking-wide'>Last Updated: 29 December 2023</h1>

        <div className='w-full flex flex-col items-start justify-center space-y-4 px-2 md:px-[5vw]'>
          {privacyContent.map((section, index) => (
            <RegulatoryCompliance key={index} title={section.title} content={section.content} />
          ))}

          <div className='gap-1'>
            <h1 className='text-xl md:text-2xl font-semibold tracking-wide'>9. Contact Us</h1>
            <p className='text-lg'>
              If you have questions or concerns about regulatory compliance or if you require additional information, please contact our legal team at {' '}
              <a href='mailto:ziyarabani@gmail.com' className='text-blue-800 dark:text-blue-400 underline cursor-pointer'>
                ziyarabani@gmail.com
              </a>
              .
            </p>
          </div>

        </div>

      </div>
    </MaxWidthWrapper >
  )
}
