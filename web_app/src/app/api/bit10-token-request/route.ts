import { type NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { env } from '@/env'
import type Mail from 'nodemailer/lib/mailer'
import { render } from '@react-email/render'
import { BIT10DEFIRequest } from '@/emails/BIT10Request'

export async function POST(request: NextRequest) {
    const myEmail = env.PERSONAL_EMAIL;
    const password = env.EMAIL_PASSWORD;
    const email2 = 'harshalraikwar07@gmail.com';

    const { newTokenSwapId, principalId, bit10tokenQuantity, bit10tokenName, bit10tokenBoughtAt } = await request.json() as { newTokenSwapId: string; principalId: string; bit10tokenQuantity: string; bit10tokenName: string; bit10tokenBoughtAt: string; };

    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: myEmail,
            pass: password,
        },
    });

    const emailHtml = await render(BIT10DEFIRequest({ newTokenSwapId, principalId, bit10tokenQuantity, bit10tokenName, bit10tokenBoughtAt }));

    const mailOptions: Mail.Options = {
        from: {
            name: 'BIT10',
            address: `${myEmail}`
        },
        to: myEmail,
        cc: email2,
        // replyTo: email,
        subject: `${bit10tokenName} token request from ${principalId}`,
        html: emailHtml
    };

    const sendMailPromise = () =>
        new Promise<string>((resolve, reject) => {
            transport.sendMail(mailOptions, function (err) {
                if (!err) {
                    resolve('Email sent successfully!');
                } else {
                    reject(new Error(err.message));
                }
            });
        });

    try {
        await sendMailPromise();
        return NextResponse.json({ message: 'Email sent successfully!' });
    } catch (err) {
        return NextResponse.json({ error: err }, { status: 500 });
    }
}
