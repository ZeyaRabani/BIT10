import React from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'

interface TermSectionProps {
    title: string;
    content: string[];
}

const termsContent: TermSectionProps[] = [
    {
        title: '1 Eligibility',
        content: [
            'To be eligible to access and use the Website, you must be at least 18 years old (or the age of majority where you reside, whichever is older), and must not be barred from using the Website under applicable law. In addition, you must be able to form a legally binding contract online either on behalf of a company or as an individual.',
            'If you are agreeing to the Agreement on behalf of a company or other legal entity, you represent that you have the legal authority to bind the company or other legal entity to the terms of the Agreement, can form a legally binding contract online, and have the full right, power and authority to enter into and to comply with the obligations under the Agreement.',
            'Additionally, by accessing the Website, you represent and warrant that you are not subject to sanctions by the United States, and are not a citizen or resident of a state, country, territory or other jurisdiction that is embargoed by the United States or where your use of the Website would be illegal or otherwise violate any domestic or foreign law, rule, statute, or regulation ("Applicable Law").',
            'We may suspend, restrict or terminate your access to any or all of the features via the Website, and/or block or bar any transactions of yours if: a) We are so required by a subpoena, court order, or binding order of a government authority, or under any applicable laws and regulations; b) You breach this Agreement including without limitation to conducting any prohibited activities under this Agreement; c) We determine to do so for any legal or regulatory reasons at our sole discretion.',
            'Certain tokens offered on the Website have specific eligibility, beyond the general eligibility above.  Click here to be taken to the list of Tokens Restricted for Restricted Persons ("Restricted Tokens").  Prior to entering any transaction for tokens on the Website, you agree to review the list of Restricted Tokens and monitor the list for updates to ensure your compliance with the Agreement and any Applicable Law.  ',
            'You shall not purchase or otherwise acquire the Restricted Tokens if you are: a citizen, resident (tax or otherwise), and/or green card holder, incorporated in, owned or controlled by a person or entity in, located in, or have a registered office or principal place of business in the U.S. (defined as a U.S. person), or if you are a person in any jurisdiction in which such offer, sale, and/or purchase of the Restricted Tokens is unlawful, prohibited, or unauthorized (together with U.S. persons, a "Restricted Person").  The term "Restricted Person" includes, but is not limited to, any natural person residing in, or any firm, company, partnership, trust, corporation, entity, government, state or agency of a state, or any other incorporated or unincorporated body or association, association or partnership (whether or not having separate legal personality) that is established and/or lawfully existing under the laws of, a jurisdiction in which such offer, sale, and/or purchase of Restricted Tokens is unlawful, prohibited, or unauthorized). You shall not resell or otherwise transfer the Restricted Tokens to any Restricted Person, including but not limited to, citizens, residents (tax or otherwise), or green card holders of the U.S.,  entities incorporated in, owned or controlled by a person or entity in, located in, or have a registered office or principal place of business in the United States of America. The transfer or resale of the Restricted Tokens to any Restricted Person is not permitted.',
        ]
    },
    {
        title: '2 Modifications to these Terms',
        content: [
            'We reserve the right, in our sole discretion, to modify the Agreement at any time. If we make changes, we will provide you with notice of such changes by updating the date at the top of this Agreement. Unless we say otherwise in our notice, any modifications are effective immediately, and your continued use of the Website will confirm your acceptance of the changes. If you do not agree to the amended Agreement, you must stop using the Website.',
        ]
    },
    {
        title: '3 Proprietary Rights',
        content: [
            'Subject to the foregoing, BIT10 owns or is duly authorized to use all intellectual property and other rights in the Website and its contents, including all text, images and trademarks displayed or provided on the Website, and all Website software. Unless expressly authorized by us, you may not copy, modify, adapt, rent, license, sell, publish, distribute, or otherwise permit any third party to access or use the Website or any of its contents. Provided that you are eligible, and in consideration for your compliance with the terms of this Agreement, you are hereby granted a single, personal, limited license to access and use the Website. This license is non-exclusive, non-transferable, and freely revocable by us at any time without notice or cause. Use of the Website or its contents for any purpose not expressly permitted by this Agreement is strictly prohibited.',
            'Unlike the Website software, the underlying smart contract protocols operating on the ICP Blockchain that facilitate trades through the Website are open source software and not BIT10 proprietary software.',
        ]
    },
    {
        title: '4 Warranty Disclaimer',
        content: [
            'To the maximum extent permitted under Applicable Law, the Website (and any of its content or functionality) is provided on an "AS IS" and "AS AVAILABLE" basis, and we expressly disclaim, and you hereby waive, any representations, conditions or warranties of any kind, whether express or implied, legal, statutory or otherwise, or arising from statute, otherwise in law, course of dealing, or usage of trade, including, without limitation, the implied or legal warranties and conditions of merchantability, merchantable quality, quality or fitness for a particular purpose, title, security, availability, reliability, accuracy, quiet enjoyment and non-infringement of third party rights. Without limiting the foregoing, we do not represent or warrant that the Website (including any related data) will be uninterrupted, available at any particular time or error-free. Further, we do not warrant that errors in the Website are correctable or will be corrected.'
        ]
    },
    {
        title: '5 Disclaimer about Information Accuracy',
        content: [
            'You are aware that we rely on third-party sources for information You are aware that we rely on third-party sources for information about certain digital tokens listed via the Website and we have the right to choose, change and remove any third-party information source at our discretion. Digital token information, including token description, total supply, market cap and 24 hour volume, is currently derived from third-party sources such as coinmarketcap.com. We are not responsible for the quality, accuracy, timeliness, completeness or reliability of any of the digital token information via the Website. You are obligated to collect sufficient information and keep yourself well informed before trading any digital tokens through the Website.'
        ]
    },
    {
        title: '6 Disclaimer about Tokens',
        content: [
            'Prior to entering any transaction for tokens on the Website, you agree to review the list of BIT10 and monitor the list for updates to ensure your compliance with the Agreement and any Applicable Law.',
            'You shall not purchase or otherwise acquire any of our restricted token products if you are: a citizen, resident (tax or otherwise), and/or green card holder, incorporated in, owned or controlled by a person or entity in, located in, or have a registered office or principal place of business in the U.S. (defined as a U.S. person), or if you are a person in any jurisdiction in which such offer, sale, and/or purchase of any tokens on the list of Tokens Restricted for Restricted Persons is unlawful, prohibited, or unauthorized (together with U.S. citizens, residents, and/or green card holders, a "Restricted Person").  The term "Restricted Person" includes, but is not limited to, any natural person residing in, or any firm, company, partnership, trust, corporation, entity, government, state or agency of a state, or any other incorporated or unincorporated body or association, association or partnership (whether or not having separate legal personality) that is established and/or lawfully existing under the laws of, a jurisdiction in which such offer, sale, and/or purchase of any tokens on the list of Tokens Restricted for Restricted Persons is unlawful, prohibited, or unauthorized).  You shall not resell or otherwise transfer any tokens on the list of Tokens Restricted for Restricted Persons to any Restricted Person, including but not limited to, citizens, residents, or green card holders of the United States of America or any natural person or entity within the United States of America. The transfer or resale of any tokens on the list of Tokens Restricted for Restricted Persons to any Restricted Person is not permitted.',
            'You understand that BIT10 is not registered or licensed by the Commodity Futures Trading Commission, Securities and Exchange Commission, Financial Crimes Enforcement Network, or any financial regulatory authority, and that no financial regulatory authority has reviewed or approved the Website. You further understand that BIT10 is not acting as an investment adviser or commodity trading adviser to any person, does not offer securities services in the United States or to U.S. persons, and that the contents of the Website do not constitute advice or recommendations concerning any commodity, security or other asset.',
            'Any third party promoting BIT10 products does so under the express understanding and agreement that they have a new product diligence, compliance and KYC obligation and function, and offer BIT10 products only where they are permitted to do so in full compliance with all applicable regulations.',
            'Third parties promote BIT10 products at their own discretion and risk, taking on all regulatory compliance burdens that come with such activity, in all jurisdictions in which they offer them. BIT10 shall not be liable for such third party\'s\' failures of regulatory compliance.',
            'Additionally, no person may acquire BIT10 products unless they are in compliance with the Disclaimer regarding the Tokens Restricted for Restricted Persons and are:',
            '- (A) not a "U.S. Person" as defined in Rule 902 of Regulation S promulgated under the Securities Act, (B) not offering, trading or holding BIT10 products for the account or benefit of any U.S. Person, (C) not intending to sell, grant any participation in, or otherwise distributing BIT10 products to any U.S. Person;',
            '- (A) not a "U.S. person" as defined in 17 C.F.R. § 23.23(a)(23) of the CFTC Cross-Border Swaps Rule, (B) not acquiring BIT10 assets for the account or benefit of any U.S. person, (C) not intending to sell, grant any participation in, or otherwise distributing BIT10 products to any U.S. Person; and',
            '- Not intending to offer, sell, or distribute BIT10 products or have a direct or indirect participation in any such undertaking or the underwriting of any such undertaking.',
            'BIT10 shall not be liable for any person or entity\'s failure to understand, agree to and comply with each of the provisions above.'
        ]
    },
    {
        title: '7 Limit Order',
        content: [
            'You can buy or sell digital tokens at a specified price within a specified timeframe. BIT10 makes no guarantee that a limit order will be matched or executed.'
        ]
    },
    {
        title: '8 Payments and Fees',
        content: [
            'The Website utilizes ICP and smart contracts to connect users with the ICP and other Blockchains. Transactions on ICP or that otherwise involve the use of an underlying blockchain or other decentralized or permissioned infrastructure (the "Distributed Ledger Technology") require that you pay a fee, such as "gas" charges on the ICP network, for the computational resources required to perform a transaction on the particular Distributed Ledger Technology (such payments and fees, "Charges").',
            'BIT10 also reserves the right to issue tokens via the ICP Smart Contracts determine the best price for you; you may not have any control over whether the Website delivers you tokens through the ICP or the IEISC.',
            'You acknowledge and agree that BIT10 has no control over any Distributed Ledger Technology transactions, the method of payment of any Charges, if applicable, or any actual payments of Charges, if applicable. Accordingly, you must ensure that you have a sufficient balance of the applicable Distributed Ledger Technology network tokens stored at your Distributed Ledger Technology-compatible wallet address ("Distributed Ledger Technology Address") to complete any transaction on the Distributed Ledger Technology before initiating such transaction.'
        ]
    },
    {
        title: '9 Ownership of Digital Tokens',
        content: [
            'You have full custody and control of the digital tokens in your digital wallets at all times. We do not custody your digital tokens and do not have access to, or retain the electronic private key of your digital wallet. As the owner and custodian of the digital tokens in your digital wallets, you shall bear all risk of loss of such digital tokens and you assume all legal risks associated with ownership of the tokens, as set forth in Section 10 of the Agreement.'
        ]
    },
    {
        title: '10 Risks Associated with Digital Tokens',
        content: [
            'By accessing and using the Website, you represent that you understand the inherent risks associated with using cryptographic and blockchain-based systems, and that you have a working knowledge of the usage and intricacies of digital tokens such as Bitcoin (BTC), and other digital tokens such as those following the ICRC standards. BIT10 does not control the underlying software protocols of any digital tokens accessible on the Website. You agree that we are not responsible for the operation, functionality or security of the underlying protocols and not liable for any loss of token value you may encounter due to any operating change, malfunction or failure of the underlying protocols.',
            'You further understand that the markets for these digital tokens are highly volatile, and that there are risks associated with digital tokens including (but not limited to) those related to adoption, speculation, technology, security, and regulation. You acknowledge that the cost and speed of transacting with cryptographic and blockchain-based systems such as Bitcoin are variable and may increase dramatically at any time. You understand and agree to assume full responsibility for all of the risks of accessing and using the Website and interacting with the Bitcoin, ICP and other Blockchains, and agree that BIT10 is not responsible for any loss you may experience as a result of these risks.',
            'You further assume all legal risks associated with ownership of the tokens, including but not limited to, any investigation or enforcement action brought by the Securities and Exchange Commission and/or any other enforcement agency or organization, and any private litigation based on violations of U.S. securities laws.  In particular, you acknowledge that unauthorized resale of the U.S. Restricted Tokens, found here on our website, may subject you to civil or criminal liability under U.S. securities laws.',
            'You should be aware that anyone can create digital tokens via the Multi-Chain Networks (such as ICRC tokens on ICP). We make no representation about the nature, quality, or legal categorization of the token or associated project. You are responsible for doing your own research as well as ensuring that you may legally transact in this token in the jurisdiction where you reside.'
        ]
    },
    {
        title: '11 Taxes',
        content: [
            'It is your sole responsibility to fulfill your tax obligations that apply to your transactions conducted via the Website. You should withhold, collect, report and remit the correct amounts of taxes to the appropriate tax authorities. We make reasonable efforts to make your transaction history available through your account but we make no representation about the completeness or accuracy of that information.'
        ]
    },
    {
        title: '12 Privacy',
        content: [
            'Please refer to our privacy policy, bit10.app/privacy, for information about how we collect, use, share and otherwise process information about you.'
        ]
    },
    {
        title: '13 Changes, Suspension, Termination',
        content: [
            'We may, at our sole discretion, at any time and with or without prior notice to you, modify, suspend or disable, temporarily or permanently, the Website, in whole or in part, for any reason whatsoever, including, but not limited to, as a result of a security incident.',
            'We will not be liable for any losses suffered by you resulting from any modification to the Website or from any suspension or termination, for any reason, of your access to all or any portion of the Website.',
            'All of the terms of the Agreement will survive any termination of your access to the Website regardless of the reasons for its expiration or termination, in addition to any other provision which by law or by its nature should survive.'
        ]
    },
    {
        title: '14 Electronic Notices',
        content: [
            'You consent to receive all communications, agreements, documents, receipts, notices, and disclosures electronically (collectively, our "Communications") that we provide in connection with the Agreement or the Website. You agree that we may provide our Communications to you by posting them on the Website. You may also contact our Legal team to request additional electronic copies of our Communications by sending a support request to ziyarabani@gmail.com.'
        ]
    },
    {
        title: '15 Indemnification',
        content: [
            'You agree to hold harmless, release, defend, and indemnify us and our officers, directors, employees, contractors, agents, affiliates, and subsidiaries ("Protected Parties") from and against all claims, damages, obligations, losses, liabilities, costs and expenses arising from, including but not limited to: (a) your access to and use of the Website; (b) your violation of any term or condition of this Agreement, the right of any third party, or any other applicable law, rule, or regulation; (c) any other party\'s access and use of the Website with your assistance or using any device or account that you own or control; and (d) your violation any Applicable Law, including U.S. securities laws and all other applicable regulatory restrictions or requirements, in connection with your purchase or ownership of tokens purchased on the Website.'
        ]
    },
    {
        title: '16 Prohibited Activities',
        content: [
            'You agree not to engage in, or attempt to engage in, any of the following categories of prohibited activity in relation to your access to or use of the Website:',
            '- 16.1 Intellectual Property Infringement - Activity that infringes or violates any person or entity\'s copyright, trademark, service mark, patent, right of publicity, right of privacy, or other proprietary or intellectual property rights under the law.',
            '- 16.2 Cyberattack - Activity that seeks to interfere with or compromise the integrity, security or proper functioning of any computer, server, network, personal device or other information technology system, including (but not limited to) the deployment of viruses and denial of service attacks.',
            '- 16.3 Fraud or Misrepresentation - Activity that seeks to defraud us or any other person or entity, including (but not limited to) providing any false, inaccurate, or misleading information in order to unlawfully obtain the property of another.',
            '- 16.4 Market Manipulation - Activity that violates any applicable law, rule, or regulation concerning the integrity of markets, including (but not limited to) the manipulative tactics commonly known as spoofing and wash trading.',
            '- 16.5 Gambling - Activity that stakes or risks something of value upon the outcome of a contest of others, an event, or a game of chance, including without limitation to lotteries, bidding fee auctions, political betting, sports forecasting and sweepstakes.',
            '- 16.6 IP Address Disguise: Activity that enables non-eligible persons to access or trade via the Website by using any virtual private network, proxy service, or any other third party service, network, or product with the intent of disguising your IP address or location.',
            '- 16.7 Any Other Unlawful Conduct - Activity that violates any applicable law, rule, or regulation of the United States or another relevant jurisdiction, including (but not limited to) the restrictions and regulatory requirements imposed by U.S. law, including U.S. securities laws and all other applicable regulatory restrictions or requirements.'
        ]
    },
    {
        title: '17 Exclusion of Consequential and Related Damages',
        content: [
            'In no event will BIT10 be liable for any incidental, indirect, special, punitive, exemplary, consequential or similar damages or liabilities whatsoever (including, without limitation, damages for loss of data, information, revenue, goodwill, profits or other business or financial benefit) arising out of or in connection with your use of the Website, whether under contract, tort (including negligence), civil liability, statute, strict liability, breach of warranties, or under any other theory of liability, and whether or not BIT10 has been advised of, knew of or should have known of the possibility of such damages.'
        ]
    },
    {
        title: '18 Limitation of Liability',
        content: [
            'In no event will BIT10\'s aggregate liability arising out of or in connection with the Website (and any of its content and functionality), any performance or non-performance of BIT10, Distributed Ledger Technology tokens, other digital tokens, BIT10 Tokens or any other product, service or other item provided in connection with the Website, whether under contract, tort (including negligence), civil liability, statute, strict liability, applicable securities regulations, or other theory of liability exceed the amount of fees paid by you to us in the twelve (12) month period immediately preceding the event giving rise to the claim for liability.'
        ]
    },
    {
        title: '19 Release',
        content: [
            'To the extent permitted by applicable law, in consideration for being allowed to use the Website, you hereby release and forever discharge BIT10 from, and hereby waive and relinquish, each and every past, present and future dispute, claim, controversy, demand, right, obligation, liability, action and cause of action of every kind and nature (including personal injuries, death, and property damage), that has arisen or arises directly or indirectly out of, or that relates directly or indirectly, to the Website. YOU HEREBY WAIVE ANY APPLICABLE PROVISION IN LAW OR REGULATION IN CONNECTION WITH THE FOREGOING, INCLUDING THE PROVISIONS OF SECTION 1542 OF THE CALIFORNIA CIVIL CODE, WHICH STATES: "A GENERAL RELEASE DOES NOT EXTEND TO CLAIMS THAT THE CREDITOR OR RELEASING PARTY DOES NOT KNOW OR SUSPECT TO EXIST IN HIS OR HER FAVOR AT THE TIME OF EXECUTING THE RELEASE, AND THAT, IF KNOWN BY HIM OR HER WOULD HAVE MATERIALLY AFFECTED HIS OR HER SETTLEMENT WITH THE DEBTOR OR RELEASED PARTY."'
        ]
    },
    {
        title: '20 Assignment',
        content: [
            'You may not assign any rights or licenses granted under the Agreement. We reserve the right to assign any rights and/or licenses under this Agreement without restriction, including but not limited to any BIT10 affiliates or subsidiaries or any successors of BIT10\'s interests.'
        ]
    },
    {
        title: '21 Force Majeure',
        content: [
            'We shall not be responsible for any delay or failure in performance of the Website resulted directly or indirectly from any events or circumstances beyond our reasonable control, including but not limited to, natural disaster, civil unrest, terrorism, significant market volatility and failure of Internet services, equipment or software.'
        ]
    },
    {
        title: '22 Dispute Resolution and Arbitration',
        content: [
            'Please read the following section carefully because it requires you to arbitrate certain disputes and claims with BIT10 and limits the manner in which you can seek relief from us, unless you opt out of arbitration by following the instructions set forth below. In addition, arbitration precludes you from suing in court or having a jury trial.',
            'You and BIT10 agree that any dispute arising out of or related to this Agreement, including threshold questions of the arbitrability of the dispute, is personal to you and BIT10 and that any dispute will be resolved solely through individual action, and will not be brought as a class arbitration, class action or any other type of representative proceeding.',
            'Except for small claims disputes in which you or BIT10 seeks to bring an individual action in small claims court located in the county or other applicable jurisdiction where you reside or disputes in which you or BIT10 seeks injunctive or other equitable relief for the alleged unlawful use of intellectual property, you and BIT10 waive your rights to a jury trial and to have any dispute arising out of or related to this Agreement or the Website resolved in court.',
            'You and BIT10 agree that the enforceability of this Section 16 will be substantively and procedurally governed by the Federal Arbitration Act, 9 U.S.C. § 1, et seq. (the "FAA"), to the maximum extent permitted by applicable law. As limited by the FAA, these Terms and the AAA Rules, the arbitrator will have exclusive authority to make all procedural and substantive decisions regarding any dispute and to grant any remedy that would otherwise be available in court, including the power to determine the question of arbitrability. The arbitrator may conduct only an individual arbitration and may not consolidate more than one individual\'s claims, preside over any type of class or representative proceeding or preside over any proceeding involving more than one individual.',
            'The arbitrator, BIT10, and you will maintain the confidentiality of any arbitration proceedings, judgments and awards, including, but not limited to, all information gathered, prepared and presented for purposes of the arbitration or related to the disputes. The arbitrator will have the authority to make appropriate rulings to safeguard confidentiality, unless the law provides to the contrary. The duty of confidentiality does not apply to the extent that disclosure is necessary to prepare for or conduct the arbitration hearing on the merits, in connection with a court application for a preliminary remedy or in connection with a judicial challenge to an arbitration award or its enforcement, or to the extent that disclosure is otherwise required by law or judicial decision.',
            'You and BIT10 agree that for any arbitration you initiate, you will pay all AAA fees and costs. For any arbitration initiated by BIT10, BIT10 will pay all AAA fees and costs.',
            'Any claim arising out of or related to this Agreement must be filed within one year after such claim arose; otherwise, the claim is permanently barred, which means that you and BIT10 will not have the right to assert the claim.',
            'You have the right to opt out of binding arbitration within 30 days of the date you first accepted the terms of this Section 16 by emailing us at ziyarabani@gmail.com. In order to be effective, the opt-out notice must include your full name and address and clearly indicate your intent to opt out of binding arbitration. By opting out of binding arbitration, you are agreeing to resolve disputes in accordance with Section 17.',
            'If any portion of this Section 16 is found to be unenforceable or unlawful for any reason, the unenforceable or unlawful provision will be severed from this Agreement, severance of the unenforceable or unlawful provision will have no impact whatsoever on the remainder of this Section 16 or the parties\' ability to compel arbitration of any remaining claims on an individual basis under this Section 16, and to the extent that any claims must therefore proceed on a class, collective, consolidated, or representative basis, such claims must be litigated in a civil court of competent jurisdiction and not in arbitration, and the parties agree that litigation of those claims will be stayed pending the outcome of any individual claims in arbitration. Further, if any part of this Section 16 is found to prohibit an individual claim seeking public injunctive relief, that provision will have no effect to the extent such relief is allowed to be sought out of arbitration, and the remainder of this Section 16 will be enforceable.'
        ]
    },
    {
        title: '23 Governing Law',
        content: [
            'The interpretation and enforcement of the Agreement, and any dispute related to the Agreement or the App, will be governed by and construed and enforced in accordance with the laws of the Cayman Islands, as applicable, without regard to conflict of law rules or principles that would cause the application of the laws of any other jurisdiction. You agree that we may initiate a proceeding related to the enforcement or validity of our intellectual property rights in any court having jurisdiction. You agree that Delaware, United States of America is the proper forum for any appeals of an arbitration award or for court proceedings in the event that this Agreement\'s binding arbitration clause is found to be unenforceable.'
        ]
    },
    {
        title: '24 Questions',
        content: [
            'If you have any questions regarding this Privacy Policy contact us at ziyarabani@gmail.com.'
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
                <h1 className='font-semibold text-xl tracking-wide'>Last Updated: 24 September 2024</h1>

                <div className='flex items-center justify-center py-2'>
                    <p className='text-lg md:text-xl text-center max-w-5xl'>Welcome to BIT10! Before you proceed, we kindly request that you carefully read and understand our Terms of Service. By accessing or using BIT10, you agree to be bound by the following terms and conditions. If you do not agree with any part of these terms, please refrain from using our services.</p>
                </div>

                <div className='w-full flex flex-col items-start justify-center space-y-4 px-2 md:px-[5vw]'>
                    <div className=''>
                        Welcome to the BIT10 Marketing and App sites (the &apos;Website&apos;) (together with all affiliates, &apos;BIT10,&apos; &apos;we,&apos; &apos;us&apos;). The Website allows users to research and swap certain digital tokens through a variety of blockchain networks including, but not limited to, ICP and Bitcoin.

                        This Terms of Service Agreement (the &apos;Agreement&apos;) explains the terms and conditions that govern your access to and use of the Website. Please read the Agreement carefully. By accessing the Website, you accept and agree to be bound by and to comply with the Agreement, including the mandatory arbitration provision in Section 16. If you do not agree to the terms of the Agreement, you must not access or use the Website.
                    </div>

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
                        <p className='text-lg'>Thank you for choosing BIT10. We look forward to providing you with a secure and efficient financing experience.</p>
                    </div>

                </div>
            </div>
        </MaxWidthWrapper >
    )
}
