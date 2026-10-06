const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, verificationCode) => {
try {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
      html: `
        <h1>Email Verification</h1>
        <p>Your OTP code is:</p>
        <h2>${verificationCode}</h2>
        <p>This code will expire in 5 minutes.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
} catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
}
};

module.exports = {
sendVerificationEmail
};