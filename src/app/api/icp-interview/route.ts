/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/consistent-type-imports */
import { type NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'
import { render } from '@react-email/render'
import { ICPInterview } from '@/emails/ICPInterview'

export async function POST(request: NextRequest) {
    const myEmail = process.env.PERSONAL_EMAIL;
    const password = process.env.EMAIL_PASSWORD;
    const email2 = 'harshalraikwar07@gmail.com'

    const { name, email } = await request.json();

    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: myEmail,
            pass: password,
        },
    });

    const emailHtml = await render(ICPInterview({ name }));

    const mailOptions: Mail.Options = {
        from: {
            name: 'BIT10',
            address: `${myEmail}`
        },
        to: email,
        cc: email2,
        subject: 'Thank You for the Developer Grant Interview',
        html: emailHtml
    };

    const sendMailPromise = () =>
        new Promise<string>((resolve, reject) => {
            transport.sendMail(mailOptions, function (err) {
                if (!err) {
                    resolve('Email sent successfully!');
                } else {
                    reject(err.message);
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
