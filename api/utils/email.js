/* eslint-disable no-undef */
import path from 'path';
import nodemailer from 'nodemailer';
import pug from 'pug';
import { htmlToText } from 'html-to-text';
import AppError from './error.js';
import logger from './logger.js';

class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `PeakBooker <${process.env.EMAIL_FROM}>`;
  }

  createNewTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  send = async (template, subject) => {
    try {
      // render HTML based on a bug template
      const html = pug.renderFile(
        path.join(process.cwd(), 'views', `${template}.pug`),
        {
          firstName: this.firstName,
          url: this.url,
          subject,
        },
      );
      // define the email options
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: htmlToText(html),
      };

      //  create transporter
      const transporter = this.createNewTransport();

      // send email
      await transporter.sendMail(mailOptions);
    } catch (error) {
      logger.error(`Error sending email to user ${this.to}:`, error);
      throw new AppError('Error Sending email');
    }
  };

  sendWelcome = async () => {
    await this.send('welcome', 'welcome to PeakBooker family');
  };

  sendVerification = async () => {
    await this.send('verify', 'PeakBooker Email Verification');
  };

  sendResetPassword = async () => {
    await this.send(
      'passwordReset',
      'PeakBooker Account Reset Password (valid for 10 min)',
    );
  };
}

export default Email;
