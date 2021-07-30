const express = require('express');
const app = express();
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('./config/emailconfig')

dotenv.config();

const Pool = require('pg').Pool;
const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
});

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

//Exponer una carpeta como publica, unicamente para archivos estaticos: .html, imagenes, .css, .js
app.use(express.static("wwww"));

// get config vars

app.get('/', (request, response) => {
  // const nickname = 'josue'
  // var username  = 'Josue Murillo'
  // const email = 'josuemurillo1996@hotmail.con'
  // var password = '213123'
  // // response.json({ info: 'Node.js, Express, and Postgres API' })

  // pool.query('INSERT INTO users(name, email, password, nickname) VALUES ($1, $2, $3, $4)', [username, email, password, nickname], (error, results) => {
  //   if (error) {
  //     console.log(error.stack)
  //     return response.status(409).send("Usuario ya existe.");
  //   } else {
  //     response.status(201).send(`User added with ID: `)
  //   }
  // })

  console.log(request.socket.remoteAddress)

})


//Register
app.post("/register", (req, res) => {
  // Our register logic starts here
  try {
    // Get user input
    const { username, email, password } = req.body;

    // Validate user input
    if (!(email && password && username)) {
      res.status(400).send("Todos los campos son requeridos");
    }
    else {
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(password, salt);


      pool.query('INSERT INTO users(name, email, password) VALUES ($1, $2, $3)', [username, email, hash], (error, results) => {
        if (error) {
          res.status(409).send({message: "Usuario ya existe."});
        } else {
          var confirmationCode = require('crypto').randomBytes(128).toString('hex')
          saveConfirmationCode(confirmationCode, email)
          nodemailer.sendConfirmationEmail(
            username,
            email,
            confirmationCode
          );
          res.status(201).send(`Usuario añadido`)
        }
      })
    }
  } catch (err) {
    console.log(err);
  }
});

// Login
app.get("/login", (req, res) => {
  // Our login logic starts here
  try {
    // Get user input
    const { email, password } = req.body;

    // Validate user input
    if (!(email && password)) {
      res.status(400).send("Todos los campos son requeridos");
    } else {

      pool.query('SELECT * FROM users WHERE email = $1', [email], (error, results) => {
        if (error) {
          res.status(400).send("Usuario o contraseña incorrectos.");
        } else {
          if (results.rowCount == 0) {
            res.status(400).send("Usuario o contraseña incorrectos.");
          } else {
            const hash = results.rows[0].password
            if (bcrypt.compareSync(password, hash)) {
              const token = generateAccessToken(results.rows[0].email);
              res.status(200).send({token: token})
            } else {
              res.status(400).send("Usuario o contraseña incorrectos.");
            }
          }
        }
      })
    }
  } catch (err) {
    console.log(err);
  }
});

//Validate email
app.get('/confirm/:confirmationCode', (request, response) => {
  pool.query('DELETE FROM userverification WHERE hash = $1 RETURNING email;', [request.params.confirmationCode], (error, results) => {
    if (error) {
      // console.log(error);
      response.status(404).send({ message: "No se ha podido validar usuario." });
    } else {
      // console.log(results)
      if (results.rowCount == 0) {
        response.status(404).send({ message: "Usuario no encontrado." });
      } else {
        // console.log(results.rows[0].nickname)
        pool.query('UPDATE public.users SET status= true WHERE email = $1;', [results.rows[0].email], (error, results) => {
          if (error) {
            response.status(404).send({ message: "Usuario no encontrado." });
            console.log(error);
          } else {
            if (results.rowCount == 0) {
              response.status(404).send({ message: "Usuario no encontrado." });
            } else {
              response.status(201).send(`Usuario habilitado`);
            }
          }
        })
      }
    }
  })
  //response.status(201).send(`Usuario añadido`)
})

//Crear y levantar el servidor web.
app.listen(3000, () => {
  console.log("Servidor iniciado");
})

/*
app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})
*/








////////////// F U N C I O N E S  /////////////////////// 
//Generar token de acceso
function generateAccessToken(username) {
  return jwt.sign({ username: username }, process.env.TOKEN_SECRET, { expiresIn: '360d' });
}

function saveConfirmationCode(confirmationCode, email) {
  pool.query('INSERT INTO public.userverification(email, hash) VALUES ($1, $2);', [email, confirmationCode], (error, results) => {
    if (error) {
      console.log(error);
      return 0;
    } else {
      return 1
    }
  })
}

//Autenticar Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    console.log(err)

    if (err) return res.sendStatus(403)

    req.user = user

    next()
  })
}