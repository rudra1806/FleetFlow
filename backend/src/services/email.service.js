require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.EMAIL_CLIENT_ID,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
        refreshToken: process.env.EMAIL_REFRESH_TOKEN,
    },
});

// Verify the connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error("Error connecting to email server:", error.message);
    } else {
        console.log("Email server is ready to send messages");
    }
});

// Core send function
const sendEmail = async (to, subject, text, html) => {
    try {
        await transporter.sendMail({
            from: `"FleetFlow" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
    } catch (error) {
        console.error("Error sending email:", error.message);
    }
};

async function sendRegistrationEmail(email, name) {
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const subject = "Welcome to FleetFlow 🚛";
    const text = `Hello ${name}, welcome to FleetFlow! Your account was created on ${now}.`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #2563eb;">Welcome to FleetFlow 🚛</h2>
            <p>Hello <b>${name}</b>,</p>
            <p>Your FleetFlow account has been created successfully.</p>
            <p><strong>Registration Date:</strong> ${now}</p>
            <hr style="border: 1px solid #e5e7eb;" />
            <p style="color: #6b7280; font-size: 12px;">FleetFlow - Modular Fleet & Logistics Management System</p>
        </div>
    `;
    await sendEmail(email, subject, text, html);
    console.log("Registration email sent to:", email);
}

async function sendLoginEmail(email, name) {
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const subject = "Login Alert - FleetFlow";
    const text = `Hello ${name}, a login to your FleetFlow account was detected on ${now}.`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #2563eb;">Login Alert 🔐</h2>
            <p>Hello <b>${name}</b>,</p>
            <p>A login to your FleetFlow account was detected.</p>
            <p><strong>Login Date & Time:</strong> ${now}</p>
            <p>If this wasn't you, please contact your administrator immediately.</p>
            <hr style="border: 1px solid #e5e7eb;" />
            <p style="color: #6b7280; font-size: 12px;">FleetFlow - Modular Fleet & Logistics Management System</p>
        </div>
    `;
    await sendEmail(email, subject, text, html);
    console.log("Login email sent to:", email);
}

async function sendForgotPasswordEmail(email, name, resetToken) {
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const subject = "Password Reset - FleetFlow";
    const text = `Hello ${name}, a password reset was requested for your FleetFlow account on ${now}.`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #2563eb;">Password Reset Request 🔑</h2>
            <p>Hello <b>${name}</b>,</p>
            <p>A password reset was requested for your account.</p>
            <p><strong>Requested at:</strong> ${now}</p>
            <p>If you did not request this, please ignore this email.</p>
            <hr style="border: 1px solid #e5e7eb;" />
            <p style="color: #6b7280; font-size: 12px;">FleetFlow - Modular Fleet & Logistics Management System</p>
        </div>
    `;
    await sendEmail(email, subject, text, html);
    console.log("Forgot password email sent to:", email);
}

module.exports = {
    sendRegistrationEmail,
    sendLoginEmail,
    sendForgotPasswordEmail,
};