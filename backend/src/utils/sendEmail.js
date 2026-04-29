const sendEmail = async (options) => {
    if (!process.env.BREVO_API_KEY) {
        console.warn('WARNING: BREVO_API_KEY is missing. Email will not be sent.');
        throw new Error('BREVO_API_KEY is not configured');
    }

    const payload = {
        sender: { name: 'Task Dashboard', email: 'nencykathiriya28@gmail.com' },
        to: [{ email: options.email }],
        subject: options.subject,
        htmlContent: options.html || `<p>${options.message}</p>`,
    };

    try {
        console.log('Sending email via Brevo API to:', options.email);

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('BREVO API ERROR:', data);
            throw new Error(data.message || 'Failed to send email via Brevo');
        }

        console.log('Email sent successfully via Brevo! MessageId:', data.messageId);
        return data;
    } catch (err) {
        console.error('CRITICAL EMAIL ERROR:', err.message);
        throw err;
    }
};

export default sendEmail;
