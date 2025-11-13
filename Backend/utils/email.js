import nodemailer from "nodemailer";

export default async function sendEmail(options) {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or use host/port/auth for other services
    auth: {
      user: process.env.HOST_EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: "Your App <yourapp@example.com>",
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
}
