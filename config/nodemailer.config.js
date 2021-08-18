const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
dotenv.config();

const host = process.env.HOST;
const user = process.env.EMAIL_USER

const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    type: 'OAuth2',
    user: user,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
    accessToken: process.env.ACCESS_TOKEN,
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