import React from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Link from 'next/link'

interface FAQs {
    value: number;
    question: string;
    answer: string;
}

const faqItems = [
    {
        question: 'What is C10 and how does it work?',
        answer: 'C10  a revolutionary platform that leverages blockchain technology to offer a tokenized investment solution. Our token mirrors the performance of either the top cryptocurrencies or curated Bitcoin native assets, providing users with a seamless and transparent way to diversify their digital asset portfolios'
    },
    {
        question: 'How do I get started with C10?',
        answer: 'To get started, simply create an account on our platform. Once registered, you can explore the dashboard, customize your portfolio, and begin investing in the future of decentralized finance.'
    },
    {
        question: 'Is C10 secure?',
        answer: 'Yes, security is our top priority. We implement robust measures, including two-factor authentication, to ensure the safety of your account and investments. Our commitment to regulatory compliance further adds an extra layer of protection.'
    },
    {
        question: 'What sets C10 apart from traditional investments?',
        answer: 'Unlike traditional investments, C10 eliminates barriers to entry, offering a decentralized and efficient way to invest in the ever-evolving world of digital assets. Our platform provides transparency, accessibility, and flexibility in managing your portfolio.'
    },
    {
        question: 'Can I customize my investment portfolio on C10?',
        answer: 'Absolutely! C10 allows you to customize your portfolio based on your investment preferences. You can choose specific assets or rely on our algorithm to optimize your holdings for potential returns.'
    },
    {
        question: 'How often is the token value updated?',
        answer: 'The token value is updated in every 10 min. on our user-friendly dashboard. You can track the performance of your investment and monitor market trends seamlessly.'
    },
    {
        question: 'What kind of historical performance data is available on C10?',
        answer: 'C10 provides comprehensive historical performance analysis through interactive charts and graphs. You can compare the growth of your portfolio with traditional benchmarks like the S&P500.'
    },
    {
        question: 'Are there any fees associated with using C10?',
        answer: 'We believe in transparency. Details about fees, including any associated with transactions or management, can be found in the Token Details section on our platform.'
    },
    {
        question: 'How does C10 handle regulatory compliance?',
        answer: 'C10 is committed to adhering to regulatory standards. We have implemented measures to ensure compliance with relevant regulations, creating a secure and legal investment environment for our users.'
    },
    {
        question: 'Where can I find support if I have more questions?',
        answer: 'Our Support Center is a valuable resource for finding answers to common questions. If you need personalized assistance, our dedicated customer support team is ready to help. You can reach out through the Contact Us section on our platform.'
    }
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
                        <AccordionTrigger className='hover:no-underline text-left text-xl font-semibold tracking-wide'>How can I contact C10 support?</AccordionTrigger>
                        <AccordionContent className='text-lg'>
                            For any inquiries or support, you can reach out to C10&apos;s customer support team through the provided contact details on the platform. Additionally, you can contact us by submitting the form on the <Link href='/contact' passHref className='text-primary underline'>Contact page</Link>, or feel free to send us an email at <a href='mailto:ziyarabani@gmail.com' className='text-primary underline'>ziyarabani@gmail.com</a>. Our team is ready to assist you with any questions or concerns.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </MaxWidthWrapper>
    )
}
