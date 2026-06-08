import SibApiV3Sdk from "sib-api-v3-sdk";

export const sendMail = async ({ to, subject, html, attachments = [] }) => {
  console.log("BREVO_API_KEY:", process.env.BREVO_API_KEY);

  try {
    const client = SibApiV3Sdk.ApiClient.instance;
    client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    await apiInstance.sendTransacEmail({
      sender: { email: "noreply@deveraa.com", name: "ServiGlow" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      attachment: attachments.length ? attachments : undefined,
    });

  } catch (error) {
    console.error("Mail Error:", error.response?.body || error.message);
  }
};


// import nodemailer from "nodemailer";

// export const sendMail = async ({ to, subject, html }) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port: Number(process.env.SMTP_PORT),
//       secure: true, // true for 465
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//       },
//     });

//     const info = await transporter.sendMail({
//       from: `ServiGlow <${process.env.SMTP_USER}>`,
//       to,
//       subject,
//       html,
//       attachments
//     });

//     console.log("Mail sent:", info.messageId);
//   } catch (error) {
//     console.error("Mail Error:", error);
//   }
// };