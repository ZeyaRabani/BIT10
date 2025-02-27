import { type NextRequest, NextResponse } from 'next/server'
import { env } from '@/env'
import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import { render } from '@react-email/render'
import { BIT10ContactUs } from '@/emails/BIT10ContactUs'

export async function POST(request: NextRequest) {
    const myEmail = env.PERSONAL_EMAIL;
    const password = env.EMAIL_PASSWORD;
    const email2 = 'harshalraikwar07@gmail.com';

    const { email, name, message } = await request.json() as { email: string; name: string; message: string };

    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: myEmail,
            pass: password,
        },
    });

    const emailHtml = await render(BIT10ContactUs({ email, name, message }));

    const mailOptions: Mail.Options = {
        from: {
            name: 'BIT10',
            address: `${myEmail}`
        },
        to: myEmail,
        cc: email2,
        replyTo: email,
        subject: `Message from ${name} (${email}) on BIT10 Contact Us page`,
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
