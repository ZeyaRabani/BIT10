"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import BIT10BTCApprovalEmail from './BIT10BTCApprovalEmail'
import ICPInterview from './ICPInterview'

const FormSchema = z.object({
    email: z.string({
        required_error: 'Email is required.',
    }).email({
        message: 'Invalid email format.',
    })
})

export default function Page() {
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: '',
        }
    });

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        if (data.email) {

            setSubmitting(true);

            await fetch('/bit10-testnet-welcome', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    maillist: [data.email],
                })
            })
                .then((res) => res.json())
                .then((response) => {
                    toast.success(response.message)
                    form.reset();
                })
                .catch((error) => {
                    toast.error('An error occurred while submitting the form. Please try again!');
                })
                .finally(() => {
                    setSubmitting(false);
                });
        }
    }

    const maillist1 = [
        'hr5359@srmist.edu.in',
        'harshalraikwar2311@gmail.com'
    ];

    const maillist2 = [
        'harshalraikwar07@gmail.com',
        'mayoalchemist@gmail.com',
        'auxane.freslon@gmail.com',
        'ziyarabani@gmail.com',
        '00xZeus+kai1@gmail.com',
        '00xZeus+kai2@gmail.com',
        '00xZeus+kai3@gmail.com',
        '00xZeus+kai4@gmail.com',
        '00xZeus+kai5@gmail.com',
        '00xZeus+kai6@gmail.com',
        '00xZeus+kai7@gmail.com',
        '00xZeus+kai8@gmail.com',
        '00xZeus+kai9@gmail.com',
        '00xZeus+kai10@gmail.com',
        '00xZeus+kai11@gmail.com',
        '00xZeus+kai12@gmail.com',
        '00xZeus+kai13@gmail.com',
        '00xZeus+kai14@gmail.com',
        '00xZeus+kai15@gmail.com',
        '00xZeus+kai16@gmail.com',
        '00xZeus+kai17@gmail.com',
        '00xZeus+kai18@gmail.com',
        '00xZeus+kai19@gmail.com',
        '00xZeus+kai20@gmail.com',
        '00xZeus+kai21@gmail.com',
        '00xZeus+kai22@gmail.com',
        '00xZeus+kai23@gmail.com',
        '00xZeus+kai24@gmail.com',
        '00xZeus+kai25@gmail.com',
        '00xZeus+kai26@gmail.com',
        '00xZeus+kai27@gmail.com',
        '00xZeus+kai28@gmail.com',
        '00xZeus+kai29@gmail.com',
        '00xZeus+kai30@gmail.com',
        '00xZeus+kai31@gmail.com',
        '00xZeus+kai32@gmail.com',
        '00xZeus+kai33@gmail.com',
        '00xZeus+kai34@gmail.com',
        '00xZeus+kai35@gmail.com',
        '00xZeus+kai36@gmail.com',
        '00xZeus+kai37@gmail.com',
        '00xZeus+kai38@gmail.com',
        '00xZeus+kai39@gmail.com',
        '00xZeus+kai40@gmail.com',
        '00xZeus+kai41@gmail.com',
        '00xZeus+kai42@gmail.com',
        '00xZeus+kai43@gmail.com',
        '00xZeus+kai44@gmail.com',
        '00xZeus+kai45@gmail.com',
        '00xZeus+kai46@gmail.com',
        '00xZeus+kai47@gmail.com',
        '00xZeus+kai48@gmail.com',
        '00xZeus+kai49@gmail.com',
        '00xZeus+kai50@gmail.com',
        '00xZeus+kai51@gmail.com',
        '00xZeus+kai52@gmail.com',
        '00xZeus+kai53@gmail.com',
        '00xZeus+kai54@gmail.com',
        '00xZeus+kai55@gmail.com',
        '00xZeus+kai56@gmail.com',
        '00xZeus+kai57@gmail.com',
        '00xZeus+kai58@gmail.com',
        '00xZeus+kai59@gmail.com',
        '00xZeus+kai60@gmail.com',
        '00xZeus+kai61@gmail.com',
        '00xZeus+kai62@gmail.com',
        '00xZeus+kai63@gmail.com',
        '00xZeus+kai64@gmail.com',
        '00xZeus+kai65@gmail.com',
        '00xZeus+kai66@gmail.com',
        '00xZeus+kai67@gmail.com',
        '00xZeus+kai68@gmail.com',
        '00xZeus+kai69@gmail.com',
        '00xZeus+kai70@gmail.com',
        '00xZeus+kai71@gmail.com',
        '00xZeus+kai72@gmail.com',
        '00xZeus+kai73@gmail.com',
        '00xZeus+kai74@gmail.com',
        '00xZeus+kai75@gmail.com',
        '00xZeus+kai76@gmail.com',
        '00xZeus+kai77@gmail.com',
        '00xZeus+kai78@gmail.com',
        '00xZeus+kai79@gmail.com',
        '00xZeus+kai80@gmail.com',
        '00xZeus+kai81@gmail.com',
        '00xZeus+kai82@gmail.com',
        '00xZeus+kai83@gmail.com',
        '00xZeus+kai84@gmail.com',
        '00xZeus+kai85@gmail.com',
        '00xZeus+fabio1@gmail.com',
        '00xZeus+fabio2@gmail.com',
        '00xZeus+fabio3@gmail.com',
        '00xZeus+fabio4@gmail.com',
        '00xZeus+fabio5@gmail.com',
        '00xZeus+fabio6@gmail.com',
        '00xZeus+fabio7@gmail.com',
        '00xZeus+fabio8@gmail.com',
        '00xZeus+fabio9@gmail.com',
        '00xZeus+fabio10@gmail.com',
        '00xZeus+fabio11@gmail.com',
        '00xZeus+fabio12@gmail.com',
        '00xZeus+fabio13@gmail.com',
        '00xZeus+fabio14@gmail.com',
        '00xZeus+fabio15@gmail.com',
        '00xZeus+fabio16@gmail.com',
        '00xZeus+fabio17@gmail.com',
        '00xZeus+fabio18@gmail.com',
        '00xZeus+fabio19@gmail.com',
        '00xZeus+fabio20@gmail.com',
        '00xZeus+fabio21@gmail.com',
        '00xZeus+fabio22@gmail.com',
        '00xZeus+fabio23@gmail.com',
        '00xZeus+fabio24@gmail.com',
        '00xZeus+fabio25@gmail.com',
        '00xZeus+fabio26@gmail.com',
        '00xZeus+fabio27@gmail.com',
        '00xZeus+fabio28@gmail.com',
        '00xZeus+fabio29@gmail.com',
        '00xZeus+fabio30@gmail.com',
        '00xZeus+fabio31@gmail.com',
        '00xZeus+fabio32@gmail.com',
        '00xZeus+fabio33@gmail.com',
        '00xZeus+fabio34@gmail.com',
        '00xZeus+fabio35@gmail.com',
        '00xZeus+fabio36@gmail.com',
        '00xZeus+fabio37@gmail.com',
        '00xZeus+fabio38@gmail.com',
        '00xZeus+fabio39@gmail.com',
        '00xZeus+fabio40@gmail.com',
        '00xZeus+fabio41@gmail.com',
        '00xZeus+fabio42@gmail.com',
        '00xZeus+fabio43@gmail.com',
        '00xZeus+fabio44@gmail.com',
        '00xZeus+fabio45@gmail.com',
        '00xZeus+fabio46@gmail.com',
        '00xZeus+fabio47@gmail.com',
        '00xZeus+fabio48@gmail.com',
        '00xZeus+fabio49@gmail.com',
        '00xZeus+fabio50@gmail.com',
        '00xZeus+fabio51@gmail.com',
        '00xZeus+fabio52@gmail.com',
        '00xZeus+fabio53@gmail.com',
        '00xZeus+fabio54@gmail.com',
        '00xZeus+fabio55@gmail.com',
        '00xZeus+fabio56@gmail.com',
        '00xZeus+fabio57@gmail.com',
        '00xZeus+fabio58@gmail.com',
        '00xZeus+fabio59@gmail.com',
        '00xZeus+fabio60@gmail.com',
        '00xZeus+fabio61@gmail.com',
        '00xZeus+fabio62@gmail.com',
        '00xZeus+fabio63@gmail.com',
        '00xZeus+fabio64@gmail.com',
        '00xZeus+fabio65@gmail.com',
        '00xZeus+fabio66@gmail.com',
        '00xZeus+fabio67@gmail.com',
        '00xZeus+fabio68@gmail.com',
        '00xZeus+fabio69@gmail.com',
        '00xZeus+fabio70@gmail.com',
        '00xZeus+fabio71@gmail.com',
        '00xZeus+fabio72@gmail.com',
        '00xZeus+fabio73@gmail.com',
        '00xZeus+fabio74@gmail.com',
        '00xZeus+fabio75@gmail.com',
        '00xZeus+fabio76@gmail.com',
        '00xZeus+fabio77@gmail.com',
        '00xZeus+fabio78@gmail.com',
        '00xZeus+fabio79@gmail.com',
        '00xZeus+fabio80@gmail.com',
        '00xZeus+fabio81@gmail.com',
        '00xZeus+fabio82@gmail.com',
        '00xZeus+fabio83@gmail.com',
        '00xZeus+fabio84@gmail.com',
        '00xZeus+fabio85@gmail.com',
        '00xPhil+echo1@gmail.com',
        '00xPhil+echo2@gmail.com',
        '00xPhil+echo3@gmail.com',
        '00xPhil+echo4@gmail.com',
        '00xPhil+echo5@gmail.com',
        '00xPhil+echo6@gmail.com',
        '00xPhil+echo7@gmail.com',
        '00xPhil+echo8@gmail.com',
        '00xPhil+echo9@gmail.com',
        '00xPhil+echo10@gmail.com',
        '00xPhil+echo11@gmail.com',
        '00xPhil+echo12@gmail.com',
        '00xPhil+echo13@gmail.com',
        '00xPhil+echo14@gmail.com',
        '00xPhil+echo15@gmail.com',
        '00xPhil+echo16@gmail.com',
        '00xPhil+echo17@gmail.com',
        '00xPhil+echo18@gmail.com',
        '452463122@qq.com',
        'feng123sh@gmail.com',
        'mrshaikh404@gmail.com',
        'dwirizaldy09@gmail.com',
        'jake.smiith.2002@gmail.com',
        'Karthickbatty@gmail.com',
        'adam@stacks.org',
        'indisofyar@gmail.com',
        'harshalraikwar2311@gmail.com',
        '0xtradooor@gmail.com',
        'join@gmail.com',
        'agustin.march@gmail.com',
        'roger.yang8@gmail.com'
    ]

    const maillist3 = [
        '00xZeus+kai10@gmail.com',
        '00xZeus+kai11@gmail.com',
        '00xZeus+kai12@gmail.com',
        '00xZeus+kai13@gmail.com',
        '00xZeus+kai14@gmail.com',
        '00xZeus+kai15@gmail.com',
        '00xZeus+kai16@gmail.com',
    ]

    const maillist4 = [
        '00xZeus+kai17@gmail.com',
        '00xZeus+kai18@gmail.com',
        '00xZeus+kai19@gmail.com',
        '00xZeus+kai20@gmail.com',
        '00xZeus+kai21@gmail.com',
        '00xZeus+kai22@gmail.com',
        '00xZeus+kai23@gmail.com',
        '00xZeus+kai24@gmail.com',
        '00xZeus+kai25@gmail.com',
        '00xZeus+kai26@gmail.com',
    ]

    const maillist5 = [
        '00xZeus+kai27@gmail.com',
        '00xZeus+kai28@gmail.com',
        '00xZeus+kai29@gmail.com',
        '00xZeus+kai30@gmail.com',
        '00xZeus+kai31@gmail.com',
        '00xZeus+kai32@gmail.com',
        '00xZeus+kai33@gmail.com',
        '00xZeus+kai34@gmail.com',
        '00xZeus+kai35@gmail.com',
        '00xZeus+kai36@gmail.com',
    ]

    const maillist6 = [
        '00xZeus+kai37@gmail.com',
        '00xZeus+kai38@gmail.com',
        '00xZeus+kai39@gmail.com',
        '00xZeus+kai40@gmail.com',
        '00xZeus+kai41@gmail.com',
        '00xZeus+kai42@gmail.com',
        '00xZeus+kai43@gmail.com',
        '00xZeus+kai44@gmail.com',
        '00xZeus+kai45@gmail.com',
        '00xZeus+kai46@gmail.com',
    ]

    const maillist7 = [
        '00xZeus+kai47@gmail.com',
        '00xZeus+kai48@gmail.com',
        '00xZeus+kai49@gmail.com',
        '00xZeus+kai50@gmail.com',
        '00xZeus+kai51@gmail.com',
        '00xZeus+kai52@gmail.com',
        '00xZeus+kai53@gmail.com',
        '00xZeus+kai54@gmail.com',
        '00xZeus+kai55@gmail.com',
        '00xZeus+kai56@gmail.com',
    ]

    const mailist8 = [
        '00xZeus+kai57@gmail.com',
        '00xZeus+kai58@gmail.com',
        '00xZeus+kai59@gmail.com',
        '00xZeus+kai60@gmail.com',
        '00xZeus+kai61@gmail.com',
        '00xZeus+kai62@gmail.com',
        '00xZeus+kai63@gmail.com',
        '00xZeus+kai64@gmail.com',
        '00xZeus+kai65@gmail.com',
        '00xZeus+kai66@gmail.com',
    ]

    const mailist9 = [
        '00xZeus+kai67@gmail.com',
        '00xZeus+kai68@gmail.com',
        '00xZeus+kai69@gmail.com',
        '00xZeus+kai70@gmail.com',
        '00xZeus+kai71@gmail.com',
        '00xZeus+kai72@gmail.com',
        '00xZeus+kai73@gmail.com',
        '00xZeus+kai74@gmail.com',
        '00xZeus+kai75@gmail.com',
        '00xZeus+kai76@gmail.com',
    ]

    const mailist10 = [
        '00xZeus+kai77@gmail.com',
        '00xZeus+kai78@gmail.com',
        '00xZeus+kai79@gmail.com',
        '00xZeus+kai80@gmail.com',
        '00xZeus+kai81@gmail.com',
        '00xZeus+kai82@gmail.com',
        '00xZeus+kai83@gmail.com',
        '00xZeus+kai84@gmail.com',
        '00xZeus+kai85@gmail.com',
        '00xZeus+fabio1@gmail.com',
    ]

    const mailist11 = [
        '00xZeus+fabio2@gmail.com',
        '00xZeus+fabio3@gmail.com',
        '00xZeus+fabio4@gmail.com',
        '00xZeus+fabio5@gmail.com',
        '00xZeus+fabio6@gmail.com',
        '00xZeus+fabio7@gmail.com',
        '00xZeus+fabio8@gmail.com',
        '00xZeus+fabio9@gmail.com',
        '00xZeus+fabio10@gmail.com',
        '00xZeus+fabio11@gmail.com',
    ]

    const maillist12 = [
        '00xZeus+fabio12@gmail.com',
        '00xZeus+fabio13@gmail.com',
        '00xZeus+fabio14@gmail.com',
        '00xZeus+fabio15@gmail.com',
        '00xZeus+fabio16@gmail.com',
        '00xZeus+fabio17@gmail.com',
        '00xZeus+fabio18@gmail.com',
        '00xZeus+fabio19@gmail.com',
        '00xZeus+fabio20@gmail.com',
        '00xZeus+fabio21@gmail.com',
    ]

    const maillist13 = [
        '00xZeus+fabio22@gmail.com',
        '00xZeus+fabio23@gmail.com',
        '00xZeus+fabio24@gmail.com',
        '00xZeus+fabio25@gmail.com',
        '00xZeus+fabio26@gmail.com',
        '00xZeus+fabio27@gmail.com',
        '00xZeus+fabio28@gmail.com',
        '00xZeus+fabio29@gmail.com',
        '00xZeus+fabio30@gmail.com',
        '00xZeus+fabio31@gmail.com',
    ]

    const maillist14 = [
        '00xZeus+fabio32@gmail.com',
        '00xZeus+fabio33@gmail.com',
        '00xZeus+fabio34@gmail.com',
        '00xZeus+fabio35@gmail.com',
        '00xZeus+fabio36@gmail.com',
        '00xZeus+fabio37@gmail.com',
        '00xZeus+fabio38@gmail.com',
        '00xZeus+fabio39@gmail.com',
        '00xZeus+fabio40@gmail.com',
        '00xZeus+fabio41@gmail.com',
        '00xZeus+fabio42@gmail.com',
        '00xZeus+fabio43@gmail.com',
        '00xZeus+fabio44@gmail.com',
        '00xZeus+fabio45@gmail.com',
        '00xZeus+fabio46@gmail.com',
        '00xZeus+fabio47@gmail.com',
        '00xZeus+fabio48@gmail.com',
        '00xZeus+fabio49@gmail.com',
        '00xZeus+fabio50@gmail.com',
        '00xZeus+fabio51@gmail.com',
    ]

    const mailist15 = [
        '00xZeus+fabio52@gmail.com',
        '00xZeus+fabio53@gmail.com',
        '00xZeus+fabio54@gmail.com',
        '00xZeus+fabio55@gmail.com',
        '00xZeus+fabio56@gmail.com',
        '00xZeus+fabio57@gmail.com',
        '00xZeus+fabio58@gmail.com',
        '00xZeus+fabio59@gmail.com',
        '00xZeus+fabio60@gmail.com',
        '00xZeus+fabio61@gmail.com',
        '00xZeus+fabio62@gmail.com',
        '00xZeus+fabio63@gmail.com',
        '00xZeus+fabio64@gmail.com',
        '00xZeus+fabio65@gmail.com',
        '00xZeus+fabio66@gmail.com',
        '00xZeus+fabio67@gmail.com',
        '00xZeus+fabio68@gmail.com',
        '00xZeus+fabio69@gmail.com',
        '00xZeus+fabio70@gmail.com',
        '00xZeus+fabio71@gmail.com',
    ]

    const mailist16 = [
        '00xZeus+fabio72@gmail.com',
        '00xZeus+fabio73@gmail.com',
        '00xZeus+fabio74@gmail.com',
        '00xZeus+fabio75@gmail.com',
        '00xZeus+fabio76@gmail.com',
        '00xZeus+fabio77@gmail.com',
        '00xZeus+fabio78@gmail.com',
        '00xZeus+fabio79@gmail.com',
        '00xZeus+fabio80@gmail.com',
        '00xZeus+fabio81@gmail.com',
        '00xZeus+fabio82@gmail.com',
        '00xZeus+fabio83@gmail.com',
        '00xZeus+fabio84@gmail.com',
        '00xZeus+fabio85@gmail.com',
        '00xPhil+echo1@gmail.com',
        '00xPhil+echo2@gmail.com',
        '00xPhil+echo3@gmail.com',
        '00xPhil+echo4@gmail.com',
        '00xPhil+echo5@gmail.com',
        '00xPhil+echo6@gmail.com',
    ]

    const mailist17 = [
        '00xPhil+echo7@gmail.com',
        '00xPhil+echo8@gmail.com',
        '00xPhil+echo9@gmail.com',
        '00xPhil+echo10@gmail.com',
        '00xPhil+echo11@gmail.com',
        '00xPhil+echo12@gmail.com',
        '00xPhil+echo13@gmail.com',
        '00xPhil+echo14@gmail.com',
        '00xPhil+echo15@gmail.com',
        '00xPhil+echo16@gmail.com',
        '00xPhil+echo17@gmail.com',
        '00xPhil+echo18@gmail.com',
    ]

    const mailist18 = [
        '452463122@qq.com',
        'feng123sh@gmail.com',
        'mrshaikh404@gmail.com',
        'dwirizaldy09@gmail.com',
        'jake.smiith.2002@gmail.com',
        'Karthickbatty@gmail.com',
        'adam@stacks.org',
        'indisofyar@gmail.com',
        'harshalraikwar2311@gmail.com',
        '0xtradooor@gmail.com',
    ]

    const mailist19 = [
        'join@gmail.com',
        'agustin.march@gmail.com',
        'roger.yang8@gmail.com',
    ]

    async function sendEmail(maillist: string[]) {
        await fetch('/bit10-testnet-welcome', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                maillist: maillist,
            }),
        });
    }

    return (
        <div className='flex flex-col space-y-2 p-16'>
            {/* <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row'>
                    {maillist1.map((email, index) => (
                        <div key={index} className='p-2'>
                            {email}
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(maillist1)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='grid grid-cols-5 max-w-[80vw]'>
                    {maillist2.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(maillist2)}>Send Email</Button>
            </div> */}

            {/* <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {maillist3.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(maillist3)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {maillist4.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(maillist4)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {maillist5.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(maillist5)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {maillist6.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(maillist6)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {maillist7.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(maillist7)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {mailist8.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(mailist8)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {mailist9.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(mailist9)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {mailist10.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(mailist10)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {mailist11.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(mailist11)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {maillist12.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(maillist12)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {maillist13.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(maillist13)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {maillist14.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(maillist14)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {mailist15.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(mailist15)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {mailist16.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(mailist16)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {mailist17.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(mailist17)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {mailist18.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(mailist18)}>Send Email</Button>
            </div>

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <div>The email will be sent to:</div>
                <div className='flex flex-row flex-wrap max-w-[80vw]'>
                    {mailist19.map((email, index) => (
                        <div key={index} className='p-2'>
                            &apos;{email}&apos; ,
                        </div>
                    ))}
                </div>
                <Button onClick={() => sendEmail(mailist19)}>Send Email</Button>
            </div> */}

            <div className='border-2 rounded p-4 flex flex-col items-center justify-center'>
                <h1 className='Text-2xl'>Send Welcome Email</h1>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='w-full flex flex-col space-y-4'>
                        <FormField
                            control={form.control}
                            name='email'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Send welcome email to</FormLabel>
                                    <FormControl>
                                        <Input {...field} className='border-white' placeholder='Send welcome email to' />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type='submit' disabled={submitting}>
                            {submitting && <Loader2 className='w-4 h-4 animate-spin mr-2' />}
                            {submitting ? 'Sending...' : 'Send Email'}
                        </Button>
                    </form>
                </Form>
            </div>

            <BIT10BTCApprovalEmail />

            <ICPInterview />

        </div>
    )
}
