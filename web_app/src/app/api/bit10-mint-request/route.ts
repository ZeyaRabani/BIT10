import { type NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { env } from '@/env'
import type Mail from 'nodemailer/lib/mailer'
import { render } from '@react-email/render'
import { BIT10MintRequest } from '@/emails/BIT10MintRequest'

export async function POST(request: NextRequest) {
    const myEmail = env.PERSONAL_EMAIL;
    const password = env.EMAIL_PASSWORD;
    const email2 = 'harshalraikwar07@gmail.com';

    const { newTokenMintId, principalId, mintAmount, mintName, recieveAmount, recieveName, tokenMintAt } = await request.json() as { newTokenMintId: string, principalId: string, mintAmount: string, mintName: string, recieveAmount: string, recieveName: string, tokenMintAt: string };

    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: myEmail,
            pass: password,
        },
    });

    const emailHtml = await render(BIT10MintRequest({ newTokenMintId, principalId, mintAmount, mintName, recieveAmount, recieveName, tokenMintAt }));

    const mailOptions: Mail.Options = {
        from: {
            name: 'BIT10',
            address: `${myEmail}`
        },
        to: myEmail,
        cc: email2,
        // replyTo: email,
        subject: `${mintName} token mint from ${principalId}`,
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
