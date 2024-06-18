import { type NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'
import { render } from '@react-email/render'
import { BIT10BTCApprove } from '@/emails/BIT10.BTCApprove'

export async function POST(request: NextRequest) {
    const myEmail = process.env.NEXT_PUBLIC_PERSONAL_EMAIL;
    const password = process.env.NEXT_PUBLIC_EMAIL_PASSWORD;
    const email2 = 'harshalraikwar07@gmail.com'

    const { email, principalId } = await request.json();

    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: myEmail,
            pass: password,
        },
    });

    const emailHtml = render(BIT10BTCApprove({ email, principalId }));

    const mailOptions: Mail.Options = {
        from: {
            name: 'BIT10',
            address: `${myEmail}`
        },
        to: email,
        cc: email2,
        subject: 'Your BIT10.BTC Tokens are Ready',
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