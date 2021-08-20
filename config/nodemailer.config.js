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
      subject: "Por favor confirma tu correo.",
      html: `<h1>Confirmación de Email</h1>
          <h2>Hola ${name}</h2>
          <p>Gracias por registrarte en el Ecommerce de AR Nucleus. Por favor confirma tu correo haciendo click en el siguiente enlace.</p>
          <a href=http://${host}/users/confirm/${confirmationCode}> Click aquí.</a>
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