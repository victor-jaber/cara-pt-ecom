import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

// Initialize transporter only if email is configured
function getTransporter(): Transporter | null {
    if (transporter) return transporter;

    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !port || !user || !pass) {
        console.warn('Email not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS in .env');
        return null;
    }

    transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465, // true for 465, false for other ports
        auth: {
            user,
            pass,
        },
    });

    return transporter;
}

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
    try {
        const emailTransporter = getTransporter();

        if (!emailTransporter) {
            console.warn(`Email not sent (not configured): ${options.subject} to ${options.to}`);
            return false;
        }

        const from = process.env.EMAIL_FROM || 'noreply@cara-fillers.com';
        const fromName = process.env.EMAIL_FROM_NAME || 'Cara Fillers';

        await emailTransporter.sendMail({
            from: `"${fromName}" <${from}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });

        console.log(`Email sent: ${options.subject} to ${options.to}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

// Verify email configuration
export async function verifyEmailConfig(): Promise<boolean> {
    try {
        const emailTransporter = getTransporter();
        if (!emailTransporter) return false;

        await emailTransporter.verify();
        console.log('Email configuration verified successfully');
        return true;
    } catch (error) {
        console.error('Email configuration error:', error);
        return false;
    }
}
