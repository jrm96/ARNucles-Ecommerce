const express = require('express');
const app = express();
const usersRouter = require('./routes/users.routes');
const productsRouter = require('./routes/products.routes');
const experiencesRouter = require('./routes/experiences.routes');

//const pool = require('./config/database.config')

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

//Exponer una carpeta como publica, unicamente para archivos estaticos: .html, imagenes, .css, .js
app.use(express.static("wwww"));

app.get('/', (req, res) => {

 //console.log(req.headers)

  res.status(200).send({message: 'Aplicación corriendo'})

})


app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/experiences', experiencesRouter);

//Crear y levantar el servidor web.
app.listen(3000, () => {
  console.log("Servidor iniciado");
})