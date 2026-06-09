import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, text, html }) => {
  // Use ethereal for testing if no real SMTP is provided
  let transporter;
  
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate a test account if no credentials are provided
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }

  const info = await transporter.sendMail({
    from: '"Xenocoders Support" <support@xenocoders.com>',
    to,
    subject,
    text,
    html,
  });

  console.log("Message sent: %s", info.messageId);
  if (!process.env.SMTP_HOST) {
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
  return info;
};
