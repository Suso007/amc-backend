import nodemailer from 'nodemailer';
import { GraphQLError } from 'graphql';
import prisma from '../config/database.js';
import axios from 'axios';
import { Readable } from 'stream';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    attachmentUrl?: string;
    attachmentName?: string;
}

class EmailService {
    async sendProposalEmail(options: EmailOptions): Promise<void> {
        // 1. Fetch Config
        const mailSetup = await prisma.mailsetup.findFirst();

        if (!mailSetup) {
            throw new GraphQLError('Email configuration not found.', {
                extensions: { code: 'EMAIL_NOT_CONFIGURED' },
            });
        }

        try {
            // 2. Create Transporter
            const transporter = nodemailer.createTransport({
                host: mailSetup.smtphost,
                port: mailSetup.smtpport,
                secure: mailSetup.enablessl, // True for 465, false for other ports
                auth: {
                    user: mailSetup.smtpuser,
                    pass: mailSetup.smtppassword,
                },
            });

            const mailOptions: nodemailer.SendMailOptions = {
                from: `"${mailSetup.sendername}" <${mailSetup.senderemail}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                attachments: []
            };

            // 3. Handle Attachment via STREAM (Memory Efficient)
            if (options.attachmentUrl && options.attachmentName) {
                try {
                    const response = await axios.get(options.attachmentUrl, {
                        responseType: 'stream', // <--- CRITICAL CHANGE
                    });

                    mailOptions.attachments?.push({
                        filename: options.attachmentName,
                        content: response.data, // pipe the stream directly
                        contentType: 'application/pdf',
                    });
                } catch (error) {
                    console.error('Error streaming PDF attachment:', error);
                    // Decide: Do you want to fail the whole email if the PDF fails? 
                    // Usually, yes.
                    throw new Error('Failed to attach proposal PDF');
                }
            }

            // 4. Send Email
            await transporter.sendMail(mailOptions);

        } catch (error: any) {
            console.error('Error sending email:', error);
            throw new GraphQLError(`Failed to send email: ${error.message}`, {
                extensions: { code: 'EMAIL_SEND_ERROR' },
            });
        }
    }

    generateProposalEmailHTML(proposalNo: string, customerName: string, message?: string): string {
        // Basic sanitization to prevent HTML breaking
        const safeMessage = message ? message.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
        const safeName = customerName.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    /* Kept your styles, added responsive basics */
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-top: none; }
                    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>AMC Proposal</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${safeName},</p>
                        <p>Please find attached the AMC proposal <strong>${proposalNo}</strong> for your review.</p>
                        ${safeMessage ? `<p>${safeMessage}</p>` : ''}
                        <p>If you have any questions, please don't hesitate to contact us.</p>
                        <p>Best regards,<br>anglo-swiss watch co.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} anglo-swiss watch co. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

export default new EmailService();