/////////////////////////////////////////
//Servidor web en nodeJS para publicar archivos estaticos.
var express = require("express");
var app = express();

//Exponer una carpeta como publica, unicamente para archivos estaticos: .html, imagenes, .css, .js
app.use(express.static("wwww"));
 
//Crear y levantar el servidor web.
app.listen(3000);
console.log("Servidor iniciado");
////////////////////////////////////////