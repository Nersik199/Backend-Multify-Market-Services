import path from "path";
import ejs from "ejs";
import nodemailer from "nodemailer";

const { EMAIL, EMAIL_PASSWORD } = process.env;

// const transporter = nodemailer.createTransport({
// 	service: 'gmail',
// 	auth: {
// 		user: EMAIL,
// 		pass: EMAIL_PASSWORD,
// 	},
// });

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "ebba93@ethereal.email",
    pass: "A7HKqP5t5UTEVvbf9e",
  },
});

export const sendMail = async ({
  to,
  subject,
  template,
  templateData,
  attachments,
}) => {
  try {
    const templatePath = path.resolve("./views/email/", `${template}.ejs`);
    const htmlData = await ejs.renderFile(templatePath, templateData);

    const mailOptions = {
      to: to,
      from: EMAIL,
      subject: subject,
      html: htmlData,
    };
    if (attachments) {
      mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log("mail send:", info.response);
  } catch (error) {
    console.error(error);
  }
};
