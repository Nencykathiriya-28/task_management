import * as Brevo from '@getbrevo/brevo';

const sendEmail = async (options) => {
    if (!process.env.BREVO_API_KEY) {
        console.warn('WARNING: BREVO_API_KEY is missing. Email will not be sent.');
        return;
    }

    const apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.html || `<html><body><p>${options.message}</p></body></html>`;
    sendSmtpEmail.sender = { name: "Task Dashboard", email: "nencykathiriya28@gmail.com" }; // Use your verified sender email here
    sendSmtpEmail.to = [{ email: options.email }];

    try {
        console.log('Attempting to send email via Brevo API...');
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully via Brevo:', data.body.messageId);
        return data;
    } catch (err) {
        console.error('CRITICAL BREVO ERROR:', err.response?.body || err.message);
        throw err;
    }
};

export default sendEmail;
