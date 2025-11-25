// Email Service for Sending Proposal Documents

import nodemailer from 'nodemailer';
import { GraphQLError } from 'graphql';
import prisma from '../config/database.js';
import axios from 'axios';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    attachmentUrl?: string;
    attachmentName?: string;
}

class EmailService {
    async sendProposalEmail(options: EmailOptions): Promise<void> {
        // Get SMTP configuration from database
        const mailSetup = await prisma.mailsetup.findFirst();

        if (!mailSetup) {
            throw new GraphQLError('Email configuration not found. Please configure SMTP settings first.', {
                extensions: { code: 'EMAIL_NOT_CONFIGURED' },
            });
        }

        try {
            // Create transporter
            const transporter = nodemailer.createTransport({
                host: mailSetup.smtphost,
                port: mailSetup.smtpport,
                secure: mailSetup.enablessl,
                auth: {
                    user: mailSetup.smtpuser,
                    pass: mailSetup.smtppassword,
                },
            });

            // Prepare email options
            const mailOptions: any = {
                from: `"${mailSetup.sendername}" <${mailSetup.senderemail}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
            };

            // Download and attach PDF if URL provided
            if (options.attachmentUrl && options.attachmentName) {
                try {
                    const response = await axios.get(options.attachmentUrl, {
                        responseType: 'arraybuffer',
                    });

                    mailOptions.attachments = [
                        {
                            filename: options.attachmentName,
                            content: Buffer.from(response.data),
                            contentType: 'application/pdf',
                        },
                    ];
                } catch (error) {
                    console.error('Error downloading PDF attachment:', error);
                    throw new GraphQLError('Failed to download PDF attachment', {
                        extensions: { code: 'ATTACHMENT_DOWNLOAD_ERROR' },
                    });
                }
            }

            // Send email
            await transporter.sendMail(mailOptions);
        } catch (error: any) {
            console.error('Error sending email:', error);
            throw new GraphQLError(`Failed to send email: ${error.message}`, {
                extensions: { code: 'EMAIL_SEND_ERROR' },
            });
        }
    }

    generateProposalEmailHTML(proposalNo: string, customerName: string, message?: string): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background-color: #4CAF50;
                        color: white;
                        padding: 20px;
                        text-align: center;
                    }
                    .content {
                        padding: 20px;
                        background-color: #f9f9f9;
                    }
                    .footer {
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>AMC Proposal</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${customerName},</p>
                        <p>Please find attached the AMC proposal <strong>${proposalNo}</strong> for your review.</p>
                        ${message ? `<p>${message}</p>` : ''}
                        <p>If you have any questions or need clarification, please don't hesitate to contact us.</p>
                        <p>Best regards,<br>AMC Management Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply directly to this message.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

export default new EmailService();
