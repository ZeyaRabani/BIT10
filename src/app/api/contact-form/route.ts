import { type NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

export async function POST(request: NextRequest) {
    const myEmail = process.env.NEXT_PUBLIC_PERSONAL_EMAIL;
    const password = process.env.NEXT_PUBLIC_EMAIL_PASSWORD;
    const email2 = 'harshalraikwar07@gmail.com'
    const email3 = 'auxane.freslon@gmail.com'

    const { email, name, twitter, message } = await request.json();

    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: myEmail,
            pass: password,
        },
    });

    const mailOptions: Mail.Options = {
        from: email,
        to: myEmail,
        cc: [`${email2}`, `${email3}`],
        replyTo: email,
        subject: `Message from ${name} (${email}) on BIT10 Contact Us page`,
        html: `
        <div style='background-color: #020817; color: #ffffff; text-align: center; padding: 10px; border-radius: 10px;'>

            <span style='font-size: 2.5em;'>Hello there 👋</span>

            <hr style='border-top: 1px solid #666; width: 80%;'>

            <span style='font-size: 1.5em;'>Message from ${name} (${email}) on BIT10 Contact Us page from Angle Users</span>

            <p style='text-align: left; font-size: 15px; padding: 4px 20px'>
                Twitter handle: ${twitter}
            </p>

            <p style='text-align: left; font-size: 15px; padding: 4px 20px'>
                ${message}
            </p>

            <p style='text-align: left; font-size: 15px; padding: 0px 20px;'>
                ${name}
            </p>
            
            <a href='mailto:ziyarabani@gmail.com' style='color: #0066ff; text-decoration:none'>
                <p style='text-align: left; font-size: 15px; padding: 0px 20px'>
                    ${email}
                </p>
            </a>

            <p style='color: #666; text-align: center;'>
                This email was sent from the BIT10 Contact Us page.
            </p>

            <p style='color: #999; text-align: center;'>
                You can reply to this email to send a response to the recipient.
            </p>
        </div>
            `,
    };

    const sendMailPromise = () =>
        new Promise<string>((resolve, reject) => {
            transport.sendMail(mailOptions, function (err) {
                if (!err) {
                    resolve('Message sent successfully!');
                } else {
                    reject(err.message);
                }
            });
        });

    try {
        await sendMailPromise();
        return NextResponse.json({ message: 'Message sent successfully!' });
    } catch (err) {
        return NextResponse.json({ error: err }, { status: 500 });
    }
}