import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // Create reusable transporter
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: process.env.SMTP_USER?.trim(),
            pass: process.env.SMTP_PASS?.trim(),
        },
    });

    const message = {
        from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || `<p>${options.message}</p>`,
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (err) {
        console.error('NODEMAILER ERROR:', err);
        throw err;
    }
};

export default sendEmail;
