import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP_USER and SMTP_PASS must be defined in environment variables');
    }

    // Create reusable transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER.trim(),
            pass: process.env.SMTP_PASS.trim(),
        },
        debug: true, // Show debug output
        logger: true // Log information in console
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
