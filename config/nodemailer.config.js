const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
dotenv.config();

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASSWORD;
const host = process.env.HOST;

const transport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: user,
    pass: pass,
  },
});

const sendConfirmationEmail = (name, email, confirmationCode) => {
    transport.sendMail({
      from: user,
      to: email,
      subject: "Please confirm your account",
      html: `<h1>Email Confirmation</h1>
          <h2>Hello ${name}</h2>
          <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
          <a href=http://${host}/users/confirm/${confirmationCode}> Click here</a>
          </div>`,
    }).catch(err => console.log(err));
  };

const sendResetPasswordEmail = (name, email, resetCode) => {
  transport.sendMail({
    from: user,
    to: email,
    subject: "Has solicitado recuperar tu contraseña",
    html: `<h1>Recuperar Contraseña</h1>
        <h2>Hola ${name}</h2>
        <p>Hemos recibido tu solicitud para reiniciar contraseña. Por favor haz click en el siguiente enlace para crear tu nueva contraseña</p>
        <a href=http://${host}/users/newPassword/${resetCode}> Recuperar Contraseña</a>
        <p></p>
        <p>El enlace únicamente será válido por 10 minutos.</p>
        </div>`,
  }).catch(err => console.log(err));
}

module.exports = {
  sendConfirmationEmail,
  sendResetPasswordEmail,
}