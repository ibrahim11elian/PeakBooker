/* eslint-disable no-undef */
import nodemailer from 'nodemailer';

class Email {
  constructor() {}

  sendEmail = async (options) => {
    //  create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    // define the email options
    const mailOptions = {
      from: 'ibrahim ahmed <ibrahim@mail.com>',
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    // send email
    await transporter.sendMail(mailOptions);
  };
}

export default Email;
