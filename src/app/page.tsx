// import React from 'react'
// import MaxWidthWrapper from '@/components/MaxWidthWrapper'
// import Image from 'next/image'
// import IndexPreformance from '@/components/home/IndexPreformance'

// interface Feature {
//   title: string;
//   description: string;
// }

// const features: Feature[] = [
//   {
//     title: 'Decentralized Index Token',
//     description: 'Invest in a token backed by the value of the top cryptocurrencies or specifically curated Bitcoin native assets. Experience the potential benefits of diversification in the fast-evolving world of digital assets.'
//   },
//   {
//     title: 'User-Friendly Dashboard',
//     description: 'Navigate through your portfolio effortlessly with our intuitive dashboard. Get real-time updates on token value, individual asset performance, and market trends.'
//   },
//   {
//     title: 'Historical Performance Analysis',
//     description: 'Explore the historical performance of your portfolio through interactive charts and graphs. Understand the growth potential by comparing it with traditional benchmarks like the S&P500.'
//   },
//   {
//     title: 'Customizable Portfolios',
//     description: 'Tailor your investment strategy with customizable portfolios. Choose specific assets or let our algorithm optimize your holdings for maximum returns.'
//   },
//   {
//     title: 'Transparent Token Details',
//     description: 'Gain insights into how our token operates, ensuring transparency and trust. Learn about the technology, methodology, and security measures behind our innovative investment solution.'
//   },
//   {
//     title: 'Market Insights and News',
//     description: 'Stay informed with regular market insights, news, and analysis. Access resources that help you make informed decisions in the dynamic cryptocurrency landscape.'
//   },
//   {
//     title: 'User Account Security',
//     description: 'Create a secure account with ease, and manage your profile and preferences. Enhance security with two-factor authentication for peace of mind.'
//   },
//   {
//     title: 'Support Center',
//     description: 'Find answers to your questions in our comprehensive support center. Reach out to our dedicated customer support for personalized assistance.'
//   },
//   {
//     title: 'Regulatory Compliance Assurance',
//     description: 'Learn about our commitment to regulatory compliance and how we ensure a legal and secure investment environment.'
//   },
//   {
//     title: 'Engaging Community Forum',
//     description: 'Connect with fellow investors in our community forum or blog. Share insights, discuss market trends, and be part of the growing community shaping the future of finance.'
//   }
// ];

// const FeatureCard: React.FC<Feature> = ({ title, description }) => (
//   <div className='relative w-64 p-6 my-4 bg-gray-200 shadow-xl rounded-3xl'>
//     <div className=' text-gray-800'>
//       <p className='text-xl font-semibold'>{title}</p>
//       <div className='flex space-x-2 font-medium text-basic'>
//         <p>{description}</p>
//       </div>
//     </div>
//   </div>
// );

// export default function Page() {
//   return (
//     <MaxWidthWrapper>
//       <div className='flex flex-wrap-reverse md:grid md:grid-cols-2 pb-8 md:pb-0 px-0 md:px-12'>

//         <div className='md:flex md:flex-col md:justify-center'>
//           <h2 className='self-center mb-4 text-2xl font-semibold tracking-wider md:text-4xl'>Empowering Your Portfolio with the Future of Finance</h2>
//           <p className='self-center text-xl tracking-wide text-justify py-2'>
//             Welcome to BIT10, where innovation meets investment in the world of decentralized finance. Our platform harnesses the power of blockchain technology to bring you a revolutionary token that mirrors the performance of the top cryptocurrencies or Bitcoin native assets. Say goodbye to traditional investment barriers and hello to a new era of seamless, transparent, and efficient financial growth.
//           </p>
//         </div>

//         <div className='lg:p-10'>
//           <Image src='/assets/home/hero.svg' height={500} width={500} quality={100} alt='img' />
//         </div>

//       </div>

//       <IndexPreformance />

//       <div className='mb-12 text-center'>
//         <h1 className='text-4xl font-bold leading-10 sm:text-5xl sm:leading-none md:text-6xl'>Formula Used</h1>
//       </div>

//       <div className='flex items-center justify-center pb-8'>
//         Formula = (π * Average Price * Sales) / (e * 10^5) $
//         {/* sqrt(Average Price * Sales) / (10^3 * sqrt(10)) */}
//         {/* log(Average Price * Sales) / (log(10^5) - 1) */}
//         {/* (π * sqrt(Average Price * Sales)) / (e * log(10^5) */}
//         {/* Average price * Sales / 100,000 */}
//       </div>

//       <div className='mb-12 text-center'>
//         <h1 className='text-4xl font-bold leading-10 sm:text-5xl sm:leading-none md:text-6xl'>Features</h1>
//       </div>

//       <div className='flex items-center justify-center pb-8'>
//         <div className='grid grid-cols-1 gap-4 md:gap-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
//           {features.map((feature, index) => (
//             <FeatureCard key={index} {...feature} />
//           ))}
//         </div>
//       </div>

//     </MaxWidthWrapper>
//   )
// }


"use client"

import React, { useState } from 'react'
import { addUserNewsletter } from '@/lib/supabaseRequests'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Image from 'next/image'
import { Form, FormControl, FormField, FormItem, FormDescription, FormMessage, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const FormSchema = z.object({
  email: z.string({
    required_error: 'Email is required.',
  }).email({
    message: 'Invalid email format.',
  }),
})

export default function Page() {
  const [waitlist, setWaitlist] = useState([]);
  const { toast } = useToast()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const email = data.email;

    if (email) {
      const result = await addUserNewsletter({ email });

      if (result) {
        // @ts-ignore
        if (result.error === '409') {
          toast({
            title: "User already Signed Up!",
          })
        } else {
          // @ts-ignore
          setWaitlist((prevWaitlist) => [...prevWaitlist, email]);
          toast({
            title: "User Signed Up!",
          })
          form.reset();
        }
      }
    }
  };

  return (
    <div className="relative h-screen">
      <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: "url('/assets/home/signup-bg.jpg')" }}></div>
      <div className="absolute top-4 left-2 z-10">
        <Image src='/logo/logo.png' height={80} width={80} alt='img' />
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <Card className="w-[90vw] md:w-[550px] md:px-6 bg-opacity-50 bg-white font-readex">
          <CardHeader>
            <CardTitle className='text-black text-4xl md:text-5xl text-center'>BIT10</CardTitle>
            <CardDescription className='text-black text-lg pt-8'>
              <p className='py-0.5'>BIT10 is building the S&P500 of Bitcoin DeFi assets. Through 1 token, you will soon be able to diversify your portfolio with dozens of other assets belonging to the Bitcoin DeFi environment.</p>
              <p className='py-0.5'>We are launching our token this month and are looking at some testers to get feedbacks.</p>
              <p className='pt-0.5'>What you will get:</p>
              <ul>
                <li className='list-disc ml-5'>Early access to our first smart asset.</li>
                <li className='list-disc ml-5'>Opportunity to develop new product with us.</li>
                <li className='list-disc ml-5'>Private channel in our future Discord</li>
              </ul>
              <p className='pt-0.5'>To be on the whitelist and be certain to be selected:</p>
              <ul>
                <li className='list-disc ml-5'>Like and repost the first post of this <a href='https://twitter.com/bit10startup' target='_blank' className='underline'>thread.</a>.</li>
                <li className='list-disc ml-5'>Tag three friends on the <a href='https://twitter.com/bit10startup' target='_blank' className='underline'>post.</a>.</li>
                <li className='list-disc ml-5'>Follow us on <a href='https://twitter.com/bit10startup' target='_blank' className='underline'>Twitter.</a></li>
                <li className='list-disc ml-5'>Enter your email below.</li>
              </ul>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='w-full flex flex-col space-y-4'>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} className="w-full bg-white text-black text-lg" placeholder='Email' />
                      </FormControl>
                      <FormMessage className='text-destructive' />
                    </FormItem>
                  )}
                />

                <Button type='submit' className='text-white bg-black hover:bg-gray-900 w-56 self-center text-lg'>
                  Join Us
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
