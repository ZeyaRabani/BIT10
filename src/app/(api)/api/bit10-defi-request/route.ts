import { type NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

export async function POST(request: NextRequest) {
    const myEmail = process.env.NEXT_PUBLIC_PERSONAL_EMAIL;
    const password = process.env.NEXT_PUBLIC_EMAIL_PASSWORD;
    const email2 = 'harshalraikwar07@gmail.com'

    const { newTokenSwapId, principalId, bit10tokenQuantity, bit10tokenBoughtAt } = await request.json();

    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: myEmail,
            pass: password,
        },
    });

    const mailOptions: Mail.Options = {
        from: myEmail,
        to: myEmail,
        cc: [`${email2}`],
        // replyTo: email,
        subject: `BIT10.DEFI token request from ${principalId}`,
        html: `
        <div style='background-color: #1E1E1E; color: #ffffff; text-align: center; padding: 10px; border-radius: 10px;'>

            <span style='font-size: 2.5em;'>Hello there 👋</span>

            <hr style='border-top: 1px solid #666; width: 80%;'>

            <span style='font-size: 1.5em;'>Request from ${principalId} on BIT10 Swap page for ${bit10tokenQuantity} BIT10.DEFI tokens</span>

            <p style='text-align: left; font-size: 15px; padding: 0px 20px;'>
                newTokenSwapId: ${newTokenSwapId}
            </p>
            <p style='text-align: left; font-size: 15px; padding: 0px 20px;'>
                principalId: ${principalId}
            </p>
            <p style='text-align: left; font-size: 15px; padding: 0px 20px;'>
                bit10tokenQuantity: ${bit10tokenQuantity}
            </p>
            <p style='text-align: left; font-size: 15px; padding: 0px 20px;'>
                bit10tokenBoughtAt: ${bit10tokenBoughtAt}
            </p>

            <p style='color: #666; text-align: center;'>
                This email was sent from the BIT10 Swap page.
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
