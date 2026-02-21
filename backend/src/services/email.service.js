require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.EMAIL_CLIENT_ID,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
        refreshToken: process.env.EMAIL_REFRESH_TOKEN,
    },
});

// Verify the connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Error connecting to email server:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"State Bank of India" <${process.env.EMAIL_USER}>`, // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
            html, // html body
        });

        // console.log('Message sent: %s', info.messageId);
        // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

async function sendRegistrationEmail(email, name) {
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const subject = 'Welcome to State Bank of India';
    const text = `Hello ${name}, thank you for registering with State Bank of India on ${now}`;
    const html = `<p>Hello <b>${name}</b>, thank you for registering with State Bank of India.</p><p>Registration Date & Time: <b>${now}</b></p>`;
    await sendEmail(email, subject, text, html);
    console.log('Registration email sent successfully');
}

async function sendLoginEmail(email, name) {
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const subject = 'Login Alert - State Bank of India';
    const text = `Hello ${name}, you logged in to State Bank of India on ${now}`;
    const html = `<p>Hello <b>${name}</b>, you logged in to your State Bank of India account.</p><p>Login Date & Time: <b>${now}</b></p>`;
    await sendEmail(email, subject, text, html);
    console.log('Login email sent successfully');
}

async function sendTransactionEmail(email, name, amount, type) {
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const subject = 'Transaction Alert - State Bank of India';
    const text = `Hello ${name}, you performed a ${type} transaction of ${amount} on ${now}`;
    const html = `<p>Hello <b>${name}</b>, you performed a ${type} transaction of ${amount}.</p><p>Transaction Date & Time: <b>${now}</b></p>`;
    await sendEmail(email, subject, text, html);
    console.log('Transaction email sent successfully');
}

async function sendFailedTransactionEmail(email, name, amount, type) {
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const subject = 'Transaction Alert - State Bank of India';
    const text = `Hello ${name}, you performed a ${type} transaction of ${amount} on ${now}`;
    const html = `<p>Hello <b>${name}</b>, you performed a ${type} transaction of ${amount}.</p><p>Transaction Date & Time: <b>${now}</b></p>`;
    await sendEmail(email, subject, text, html);
    console.log('Transaction email sent successfully');
}

module.exports = {
    sendRegistrationEmail,
    sendLoginEmail,
    sendTransactionEmail,
    sendFailedTransactionEmail
}