import React from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Link from 'next/link'

interface FAQs {
    value: number;
    question: string;
    answer: React.ReactNode;
}

const faqItems = [
    {
        question: 'What is BIT10?',
        answer: 'BIT10 is a pioneering asset manager that offers users the opportunity to invest in an index representing the top cryptocurrencies within the crypto ecosystem. Similar to the S&P500 for traditional assets, BIT10 simplifies investment by providing a pre-selected basket of assets that can be held with just one token purchase.'
    },
    {
        question: 'How does BIT10 work?',
        answer: 'BIT10 utilizes a sophisticated backend infrastructure powered by ICP\'s ICRC-1 standard. This allows BIT10 to issue tokens backed by real-world assets through smart contracts, ensuring transparency and security. The process involves integrating an oracle for real-time data from sources like the ICP exchange rate canister and Coinbase API to determine the current value of BIT10 tokens.'
    },
    {
        question: 'What are the benefits of investing in BIT10?',
        answer: (
            <>
                Investing in BIT10 offers several advantages: <br />
                - <b>Diversification</b>: Gain exposure to multiple cryptocurrencies with a single investment. <br />
                - <b>Simplicity</b>: Eliminate the need for complex research and management of individual tokens. <br />
                - <b>Cost-effectiveness</b>: Reduce transaction fees associated with acquiring and managing multiple assets. <br />
                - <b>Market exposure</b>: Participate in the growth potential of emerging technologies within the crypto ecosystem. <br />
            </>
        ),
    },
    {
        question: 'Is BIT10 secure?',
        answer: 'Yes, security is our top priority. We implement robust measures, including two-factor authentication, to ensure the safety of your account and investments. Our commitment to regulatory compliance further adds an extra layer of protection.'
    },
    {
        question: 'How is BIT10 collateralized?',
        answer: 'BIT10 tokens are fully collateralized by acquiring and securely storing an equivalent value of the underlying assets. This ensures that each token issued by BIT10 is backed by real assets, providing confidence to investors in the token\'s value and stability.'
    },
    {
        question: 'How often is the token value updated?',
        answer: 'The token value is updated in every 10 min. on our user-friendly dashboard. You can track the performance of your investment and monitor market trends seamlessly.'
    },
    {
        question: 'What is the calculation method for the BIT10 token value',
        answer: 'The value of the BIT10 token is determined by averaging the current prices of its constituent tokens, which include ICP, Stacks, Conflux, Map Protocol, RIF, and Sovryn. This straightforward method ensures transparency and ease of understanding for investors.'
    },
    {
        question: 'What use cases does BIT10 offer?',
        answer: (
            <>
                BIT10 serves various use cases: <br />
                - <b>Diversified investment portfolio</b>: Access a curated selection of crypto tokens without managing individual assets. <br />
                - <b>Simplified DeFi access</b>: Easy entry into the crypto space with a single token purchase. <br />
                - <b>Hedging and risk management</b>: Mitigate market volatility by diversifying investments across multiple assets. <br />
                - <b>Governance participation</b>: Indirectly participate in governance features offered by included tokens. <br />
            </>
        ),
    },
    {
        question: 'Is BIT10 suitable for long-term investment strategies?',
        answer: 'Yes, BIT10 provides a convenient and efficient way to build a long-term investment strategy within the crypto ecosystem. Its auto-rebalancing mechanism ensures that the portfolio remains optimized for performance over time, making it ideal for investors seeking sustainable growth.'
    },
    {
        question: 'What kind of historical performance data is available on BIT10?',
        answer: 'BIT10 provides comprehensive historical performance analysis through interactive charts and graphs. You can compare the growth of your portfolio with traditional benchmarks like the S&P500.'
    },
    {
        question: 'How does BIT10 handle regulatory compliance?',
        answer: 'BIT10 is committed to adhering to regulatory standards. We have implemented measures to ensure compliance with relevant regulations, creating a secure and legal investment environment for our users.'
    },
];

const FAQsCard: React.FC<FAQs> = ({ value, question, answer }) => (
    <AccordionItem value={`item-${value + 1}`}>
        <AccordionTrigger className='hover:no-underline text-left text-xl font-semibold tracking-wide'>
            {question}
        </AccordionTrigger>
        <AccordionContent className='text-lg'>{answer}</AccordionContent>
    </AccordionItem>
);

export default function Page() {
    return (
        <MaxWidthWrapper>
            <div className='flex items-center justify-center space-x-2 py-4 max-w-[100vw]'>
                <h1 className='text-2xl font-semibold leading-tight text-center tracking-wider lg:text-4xl md:whitespace-nowrap'>Frequently Asked Questions</h1>
            </div>

            <div>
                <Accordion type='multiple' className='w-full py-8 px-4 md:px-[10vw]'>
                    {faqItems.map((item, index) => (
                        <FAQsCard key={index} value={index}  {...item} />
                    ))}
                    <AccordionItem value={`item-${faqItems.length + 1}`}>
                        <AccordionTrigger className='hover:no-underline text-left text-xl font-semibold tracking-wide'>How can I contact BIT10 support?</AccordionTrigger>
                        <AccordionContent className='text-lg'>
                            For any inquiries or support, you can reach out to BIT10&apos;s customer support team through the provided contact details on the platform. Additionally, you can contact us by submitting the form on the <Link href='/contact-us' passHref className='text-primary underline'>Contact page</Link>, or feel free to send us an email at <a href='mailto:ziyarabani@gmail.com' className='text-primary underline'>ziyarabani@gmail.com</a>. Our team is ready to assist you with any questions or concerns.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </MaxWidthWrapper>
    )
}
