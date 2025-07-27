/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { config } from 'node-config-ts';

@Injectable()
export class CommunicationService {
    private readonly logger = new Logger(CommunicationService.name);
    private transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure, // true for 465, false for other ports
            auth: {
                user: config.email.user,
                pass: config.email.pass,
            },
        });
    }

    /**
     * Sends an email using the provided details.
     * @param to The recipient's email address.
     * @param subject The subject of the email.
     * @param template The HTML content of the email.
     */
    async sendEmail(
        to: string,
        subject: string,
        template: string,
    ): Promise<void> {
        const mailOptions = {
            from: `"Your App Name" <${config.email.user}>`, // sender address
            to: to, // list of receivers
            subject: subject, // Subject line
            html: template, // html body
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(
                `Email sent successfully to ${to}. Message ID: ${info.messageId}`,
            );
        } catch (error) {
            // Type-safe error handling
            const errorMessage =
                error instanceof Error ? error.stack : String(error);
            this.logger.error(`Failed to send email to ${to}`, errorMessage);
            throw new Error('Could not send email.');
        }
    }

    sendNotification(userId: string, message: string): void {
        // Logic to send a notification to a user
        this.logger.log(`Sending notification to user ${userId}: ${message}`);
        // Here you would integrate with a notification service (e.g., Firebase Cloud Messaging)
    }
}
