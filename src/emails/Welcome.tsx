import React from 'react'
import { Tailwind, Body, Column, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text, Row } from '@react-email/components'

export function Welcome() {
    return (
        <Html>
            <Head />
            <Preview> 🎉 Exciting News: BIT10 Testnet is Live!</Preview>
            <Tailwind>
                <Body className='bg-[#f3f3f5] font-sansSerif'>
                    <Container className='w-[680px] max-w-full mx-auto'>
                        <Section className='flex p-4'>
                            <Img width='180' src='https://bit10.app/logo/logo-with-name.png' />
                            {/* <Img width='180' src='https://securelancerstorage.s3.ap-south-1.amazonaws.com/user_d9c773a2080e43fdad30f59ee8d6bb50/profile/resume/logo-with-name.png' /> */}
                        </Section>

                        <Section className='rounded-t-md flex flex-col bg-[#EA580C]'>
                            <Row className='flex flex-row justify-between'>
                                <Column className='p-3.5'>
                                    <Img className='max-w-full' width='120' src='https://bit10.app/assets/email/rocket.png' />
                                    {/* <Img className='max-w-full' width='120' src='https://securelancerstorage.s3.ap-south-1.amazonaws.com/user_d9c773a2080e43fdad30f59ee8d6bb50/profile/resume/rocket.png' /> */}
                                </Column>
                                <Column className='py-5 px-7 pb-3.5'>
                                    <Heading className='text-white text-4xl font-bold'>
                                        We are on Testnet!
                                    </Heading>
                                    <Text className='text-white text-lg'>
                                        Building the S&P 500 of Bitcoin
                                    </Text>
                                </Column>
                            </Row>
                        </Section>

                        <Section className='flex flex-col space-y-4 p-4 bg-white rounded-b-md'>
                            <Heading as='h2' className='m-0 mb-3.5 font-bold text-xl text-[#0c0d0e]'>
                            Thank you for signing up to BIT10&apso;s testnet, here&apos;s what you can expect and how to get started
                            </Heading>
                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                <span className='font-bold'>BIT10</span> is an innovative asset manager designed to give you the opportunity to buy our Index, which tracks the biggest crypto tokens, ordinals, and BRC-20&apos;s in the Bitcoin DeFi ecosystem. With BIT10, you can hold a pre-picked basket of assets simply by purchasing one token.
                            </Text>

                            <Hr className='my-5' />

                            <Heading as='h2' className='m-0 mb-3.5 font-bold text-xl text-[#0c0d0e]'>
                                What BIT10 Offers
                            </Heading>

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                1. <span className='font-bold'>Diversification</span>: Our Index tracks the biggest and most promising crypto tokens, ordinals, and BRC-20&apos;s in the Bitcoin DeFi ecosystem.
                            </Text>
                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                2. <span className='font-bold'>Simplicity</span>: Hold a variety of assets by simply buying one token.
                            </Text>
                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                3. <span className='font-bold'>Innovation</span>: BIT10 combines Bitcoin&apos;s stability with advanced financial tools, offering you a modern solution for your investments.
                            </Text>

                            <Hr className='my-5' />

                            <Heading as='h2' className='m-0 mb-3.5 font-bold text-xl text-[#0c0d0e]'>
                                Instructions to Use the Testnet
                            </Heading>

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                1. Visit the <Link href='https://bit10.app' className='text-blue-500'>BIT10 website</Link> and connect your Plug wallet. Learn more about Installing and Setting Up Plug Wallet <Link href='https://gitbook.bit10.app/testnet/installing-and-setting-up-plug-wallet' className='text-blue-500'>here</Link>.
                            </Text>
                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                2. Visit the <Link href='https://www.bit10.app/faucet' className='text-blue-500'>BIT10 Faucet</Link> and request BIT10.BTC tokens. Learn more about BIT10.BTC tokens <Link href='https://gitbook.bit10.app/testnet/obtaining-bit10.btc-tokens' className='text-blue-500'>here</Link>.
                            </Text>
                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                3. Follow the steps on this <Link href='https://gitbook.bit10.app/testnet/adding-tokens-to-display-in-your-wallet' className='text-blue-500'>page</Link> to show balance of BIT10.BTC and BIT.DEFI tokens in your Plug Wallet.
                            </Text>
                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                4.  Start trading on the <Link href='https://www.bit10.app' className='text-blue-500'>BIT10 Exchange</Link> and explore the BIT10 Index. Follow the steps on this <Link href='https://gitbook.bit10.app/testnet/swap' className='text-blue-500'>page</Link> to learn more about trading on BIT10 Exchange.
                            </Text>

                            {/* <Text className='text-[17px] leading-[17px] text-[#3c3f44] font-bold'>
                                Install the Plug Wallet:
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-1 text-[#3c3f44]'>
                                1. Visit <Link href='https://plugwallet.ooo' className='text-blue-500'>BIT10 website</Link> and install the extension in your browser. Know more about Installing and Setting Up Plug Wallet <Link href='https://gitbook.bit10.app/testnet/installing-and-setting-up-plug-wallet' className='text-blue-500'>here</Link>.
                            </Text>

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44] font-bold'>
                                Set Up Your Wallet:
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-1 text-[#3c3f44]'>
                                1. Open the Plug wallet extension.
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-1 text-[#3c3f44]'>
                                2. Note your Principal ID (unique wallet identifier) and Account ID (derived from Principal ID and used for ICP and NFT registries).
                            </Text>

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44] font-bold'>
                                Obtain BIT10.BTC Tokens:
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-1 text-[#3c3f44]'>
                                1. Visit <Link href='https://www.bit10.app/faucet' className='text-blue-500'>BIT10 Faucet </Link> to request BIT10.BTC tokens.
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-1 text-[#3c3f44]'>
                                2. Enter your email and Principal ID.
                            </Text>

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44] font-bold'>
                                Adding Tokens to Your Wallet:
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-1 text-[#3c3f44]'>
                                1. Open Plug wallet and click on the &quot;Manage&quot; button.
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-1 text-[#3c3f44]'>
                                2. Click on the &quot;Add Token&quot; icon and enter the following details:
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-3 text-[#3c3f44]'>
                                i. BIT10.BTC:
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-6 text-[#3c3f44]'>
                                Canister ID: eegan-kqaaa-aaaap-qhmgq-cai
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-6 text-[#3c3f44]'>
                                Standard: ICRC-1
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-3 text-[#3c3f44]'>
                                ii. BIT10.DEFI:
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-6 text-[#3c3f44]'>
                                Canister ID: hbs3g-xyaaa-aaaap-qhmna-cai
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-6 text-[#3c3f44]'>
                                Standard: ICRC-1
                            </Text>

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44] font-bold'>
                                Swap Tokens:
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-1 text-[#3c3f44]'>
                                1. Navigate to <Link href='https://www.bit10.app' className='text-blue-500'>BIT10 Swap</Link>.
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-1 text-[#3c3f44]'>
                                2. Select the number of BIT10.DEFI tokens you want to receive.
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-1 text-[#3c3f44]'>
                                3.  Click on the &quot;Trade&quot; button and approve the connection request for the ICP token canister
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-1 text-[#3c3f44]'>
                                4. Approve the transaction to complete the swap.
                            </Text>

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44] font-bold'>
                                View Your Transactions:
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-1 text-[#3c3f44]'>
                                1. Go to the Portfolio page to see your transaction history under the &quot;Your recent activity&quot; section
                            </Text>
                            <Text className='text-[17px] leading-[17px] pl-1 text-[#3c3f44]'>
                                2. Check the transaction status and view details on the BIT10 Explorer.
                            </Text> */}

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                Learn more about the Testnet <Link href='https://gitbook.bit10.app/testnet' className='text-blue-500'>here</Link>. We are excited to have you join us on this journey and can&apos;t wait to hear your feedback. If you encounter any issues or have questions, please don&apos;t hesitate to reach out to {''}
                                <Link href='https://x.com/zeyathezeya' className='text-blue-500'>
                                    @zeyathezeya
                                </Link> or {''}
                                <Link href='https://x.com/HarshalRaikwar6' className='text-blue-500'>
                                    @HarshalRaikwar6
                                </Link> {''}
                                for support.
                            </Text>

                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                Best Regards,
                            </Text>
                            <Text className='text-[17px] leading-[17px] text-[#3c3f44]'>
                                The BIT10 Team
                            </Text>
                        </Section>
                    </Container>

                    <Section className='w-[680px] max-w-full mx-auto'>
                        <Text className='text-gray-500'>
                            You&apos;re receiving this email because you signed up for the BIT10 Testnet.
                        </Text>
                    </Section>
                </Body>
            </Tailwind>
        </Html>
    )
}
