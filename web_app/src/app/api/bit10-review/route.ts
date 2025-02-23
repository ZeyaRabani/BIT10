import { type NextRequest, NextResponse } from 'next/server'
import { env } from '@/env'
import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import { render } from '@react-email/render'
import { Review } from '@/emails/Review'

export async function POST(request: NextRequest) {
    const myEmail = env.PERSONAL_EMAIL;
    const password = env.EMAIL_PASSWORD;
    const email2 = 'harshalraikwar07@gmail.com';

    const { email } = await request.json() as { email: string };

    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: myEmail,
            pass: password,
        },
    });

    const emailHtml = await render(Review());

    const mailOptions: Mail.Options = {
        from: {
            name: 'BIT10',
            address: `${myEmail}`
        },
        to: email,
        cc: email2,
        subject: 'We Value Your Feedback! Please Share Your Thoughts',
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
