import { Resend } from 'resend';

const sendEmail = async (options) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('WARNING: RESEND_API_KEY is missing. Email will not be sent.');
        return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        console.log('Attempting to send email via Resend API...');
        const { data, error } = await resend.emails.send({
            from: 'TaskDashboard <onboarding@resend.dev>',
            to: options.email,
            subject: options.subject,
            html: options.html || `<p>${options.message}</p>`,
        });

        if (error) {
            console.error('RESEND API ERROR:', error);
            throw new Error(error.message || 'Failed to send email via Resend');
        }

        console.log('Email sent successfully via Resend:', data.id);
        return data;
    } catch (err) {
        console.error('CRITICAL RESEND ERROR:', err.message);
        throw err;
    }
};

export default sendEmail;
