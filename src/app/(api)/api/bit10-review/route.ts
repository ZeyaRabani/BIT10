import { type NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'
import { render } from '@react-email/render'
import { Review } from '@/emails/Review'

export async function POST(request: NextRequest) {
    const myEmail = process.env.NEXT_PUBLIC_PERSONAL_EMAIL;
    const password = process.env.NEXT_PUBLIC_EMAIL_PASSWORD;
    const email2 = 'harshalraikwar07@gmail.com'

    const { maillist } = await request.json();

    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: myEmail,
            pass: password,
        },
    });

    const emailHtml = render(Review());

    const sendMail = (recipient: string) => {
        const mailOptions: Mail.Options = {
            from: {
                name: 'BIT10',
                address: `${myEmail}`
            },
            to: recipient,
            cc: [email2],
            subject: 'We Value Your Feedback! Please Share Your Thoughts',
            html: emailHtml
        };

        return new Promise<string>((resolve, reject) => {
            transport.sendMail(mailOptions, function (err) {
                if (!err) {
                    resolve('Email sent successfully!');
                } else {
                    reject(err.message);
                }
            });
        });
    };

    try {
        const batchSize = 20;
        for (let i = 0; i < maillist.length; i += batchSize) {
            const batch = maillist.slice(i, i + batchSize);
            const sendMailPromises = batch.map((recipient: string) => sendMail(recipient));
            await Promise.all(sendMailPromises);
            if (i + batchSize < maillist.length) {
                await new Promise((resolve) => setTimeout(resolve, 60000));
            }
        }
        return NextResponse.json({ message: 'Emails sent successfully!' });
    } catch (err) {
        return NextResponse.json({ error: err }, { status: 500 });
    }
}
