"use client"

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { HoverEffect } from '@/components/ui/card-hover-effect'
import Preloader from '@/components/Preloader'

type Project = {
    image_url: string;
    title: string;
    description: string;
    link: string;
};

const projects: Project[] = [
    {
        image_url: 'signup-bg.jpg',
        title: 'Getting Started with BIT10: A Beginner\'s Guide',
        description: 'A step-by-step guide for new users on how to start investing with BIT10.',
        link: 'https://x.com/bit10startup/status/1801646449605607622',
    },
    {
        image_url: 'signup-bg.jpg',
        title: 'Understanding BIT10: The S&P 500 of Bitcoin DeFi',
        description: 'Learn about the concept and benefits of BIT10 as an index tracking the top Bitcoin DeFi assets.',
        link: '/resources/blog/understanding-bit10-the-sp-500-of-bitcoin-defi',
    },
    {
        image_url: 'signup-bg.jpg',
        title: 'Top 5 Benefits of Investing in BIT10',
        description: 'Highlight the key advantages of investing in BIT10 for both novice and experienced investors.',
        link: '/resources/blog/top-5-benefits-of-investing-in-bit10',
    },
    {
        image_url: 'signup-bg.jpg',
        title: 'The Rise of DeFi: How BIT10 is Revolutionizing Crypto Investments',
        description: 'Explore how BIT10 is transforming the decentralized finance landscape by offering a diversified investment option.',
        link: '/resources/blog/the-rise-of-defi-how-bit10-is-revolutionizing-crypto-investments',
    },
    {
        image_url: 'signup-bg.jpg',
        title: 'Why Diversification Matters: A Deep Dive into BIT10\'s Strategy',
        description: 'Understand the importance of diversification and how BIT10 helps mitigate risks in the volatile crypto market.',
        link: '/resources/blog/why-diversification-matters-a-deep-dive-into-bit10s-strategy',
    },
    {
        image_url: 'signup-bg.jpg',
        title: 'The Technology Behind BIT10: An Overview of ICP and Canisters',
        description: 'Dive into the technical infrastructure that powers BIT10, including Internet Computer Protocol and canister smart contracts.',
        link: 'https://x.com/bit10startup/status/1808399164193042641',
    },
    // Future blogs
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'How BIT10 Ensures Accurate Token Valuation',
    //     description: 'An explanation of the mechanisms BIT10 uses to provide real-time, accurate token values.',
    //     link: '/resources/blog/how-bit10-ensures-accurate-token-valuation',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'Collateralization in DeFi: How BIT10 Secures Your Investments',
    //     description: 'Understand the collateralization process and how BIT10 ensures the security and value of its tokens.',
    //     link: '/resources/blog/collateralization-in-defi-how-bit10-secures-your-investments',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'BIT10 vs. Traditional Crypto Picking: Which is Better?',
    //     description: 'Compare BIT10\'s investment approach with traditional crypto picking strategies.',
    //     link: '/resources/blog/bit10-vs-traditional-crypto-picking-which-is-better',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'The Role of Oracles in BIT10\'s Ecosystem',
    //     description: 'Discover how oracles contribute to BIT10\'s accurate and reliable data provision.',
    //     link: '/resources/blog/the-role-of-oracles-in-bit10s-ecosystem',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'Maximizing Returns with BIT10\'s Auto-Rebalancing Feature',
    //     description: 'Learn how BIT10\'s auto-rebalancing mechanism optimizes your investment portfolio.',
    //     link: '/resources/blog/maximizing-returns-with-bit10s-auto-rebalancing-feature',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'Emerging Technologies in Bitcoin DeFi: A Look at BIT10\'s Portfolio',
    //     description: 'Explore the innovative projects and technologies included in BIT10\'s diversified portfolio.',
    //     link: '/resources/blog/emerging-technologies-in-bitcoin-defi-a-look-at-bit10s-portfolio',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'The Future of Decentralized Finance: BIT10\'s Vision and Mission',
    //     description: 'Gain insight into BIT10\'s long-term goals and its vision for the future of DeFi.',
    //     link: '/resources/blog/the-future-of-decentralized-finance-bit10s-vision-and-mission',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'How BIT10 Simplifies Access to Bitcoin DeFi Assets',
    //     description: 'Understand how BIT10 makes it easy for investors to gain exposure to a diversified basket of DeFi assets.',
    //     link: '/resources/blog/how-bit10-simplifies-access-to-bitcoin-defi-assets',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'Investing in BIT10: What You Need to Know About Fees and Risks',
    //     description: 'A detailed look at the costs and risks associated with investing in BIT10.',
    //     link: '/resources/blog/investing-in-bit10-what-you-need-to-know-about-fees-and-risks',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'Real-Time Performance Tracking with BIT10',
    //     description: 'Discover how BIT10 provides transparent and real-time performance tracking for investors',
    //     link: '/resources/blog/real-time-performance-tracking-with-bit10',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'BIT10\'s Approach to Managing Market Volatility',
    //     description: 'Learn about the strategies BIT10 employs to manage and mitigate market volatility',
    //     link: '/resources/blog/bit10s-approach-to-managing-market-volatility',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'How to Use BIT10 for Long-Term Investment Strategies',
    //     description: 'Tips and strategies for using BIT10 as part of a long-term investment plan.',
    //     link: '/resources/blog/how-to-use-bit10-for-long-term-investment-strategies',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'The Importance of Regular Audits in BIT10\'s Collateralization Process',
    //     description: 'An overview of the auditing processes that ensure BIT10\'s tokens are properly collateralized.',
    //     link: '/resources/blog/the-importance-of-regular-audits-in-bit10s-collateralization-process',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'BIT10\'s Governance and Decision-Making Features',
    //     description: 'Explore the governance features of the tokens included in BIT10 and how they empower investors.',
    //     link: '/resources/blog/bit10s-governance-and-decision-making-features',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'Integrating BIT10 into Your Investment Portfolio',
    //     description: 'Advice on how to incorporate BIT10 into a diversified investment portfolio.',
    //     link: '/resources/blog/integrating-bit10-into-your-investment-portfolio',
    // },

    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'BIT10\'s Impact on the Bitcoin DeFi Ecosystem',
    //     description: 'Analyze how BIT10 is influencing and contributing to the broader Bitcoin DeFi ecosystem.',
    //     link: '/resources/blog/bit10s-impact-on-the-bitcoin-defi-ecosystem',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'The Benefits of Holding BIT10 Tokens in a Bear Market',
    //     description: 'Understand the advantages of holding BIT10 tokens during market downturns.',
    //     link: '/resources/blog/the-benefits-of-holding-bit10-tokens-in-a-bear-market',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'BIT10\'s Security Measures: Keeping Your Investments Safe',
    //     description: 'Learn about the security protocols and measures BIT10 employs to protect investor assets.',
    //     link: '/resources/blog/bit10s-security-measures-keeping-your-investments-safe',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'BIT10\'s Unique Value Proposition: What Sets It Apart',
    //     description: 'Highlight the unique aspects of BIT10 that differentiate it from other investment options.',
    //     link: '/resources/blog/bit10s-unique-value-proposition-what-sets-it-apart',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'The Role of ICP in Powering BIT10\'s Infrastructure',
    //     description: 'A detailed look at how Internet Computer Protocol supports BIT10\'s operations and functionality.',
    //     link: '/resources/blog/the-role-of-icp-in-powering-bit10s-infrastructure',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'BIT10\'s Roadmap: Upcoming Features and Developments',
    //     description: 'Get a sneak peek into BIT10\'s future plans and upcoming features.',
    //     link: '/resources/blog/bit10s-roadmap-upcoming-features-and-developments',
    // },
    // {
    //     image_url: 'signup-bg.jpg',
    //     title: 'How BIT10 is Making DeFi Accessible to Everyone',
    //     description: 'Explore how BIT10 is democratizing access to decentralized finance for all types of investors',
    //     link: '/resources/blog/how-bit10-is-making-defi-accessible-to-everyone',
    // },
];

export default function Page() {
    const [searchQuery, setSearchQuery] = useState('');

    const { data: filteredProjects = [], isLoading } = useQuery({
        queryKey: ['projects', searchQuery],
        queryFn: () => {
            return projects.filter(project =>
                project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        },
        enabled: true,
    });

    const clearSearch = () => {
        setSearchQuery('');
    };

    return (
        <MaxWidthWrapper>
            <div className='flex items-center justify-center space-x-2 py-4 max-w-[100vw]'>
                <h1 className='text-2xl font-semibold leading-tight text-center tracking-wider lg:text-4xl md:whitespace-nowrap'>BIT10 Knowledge Hub</h1>
            </div>

            <div className='flex items-center md:items-start justify-center py-4 px-2'>
                <div className='flex w-full items-center'>
                    <div className='w-10 z-20 pl-1 text-center pointer-events-none flex items-center justify-center'>
                        <Search height={20} width={20} />
                    </div>
                    <Input
                        className='w-full md:max-w-md -mx-10 pl-10 pr-8 py-2 z-10 dark:border-white'
                        placeholder='Search by title or description...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div onClick={clearSearch} className='ml-2 z-20 cursor-pointer'>
                        <X />
                    </div>
                </div>
            </div>

            <div>
                {isLoading ? (
                    <Preloader />
                ) : (
                    <HoverEffect items={filteredProjects} />
                )}
            </div>
        </MaxWidthWrapper>
    );
}
