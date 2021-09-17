//Sirve para verificar si usuario esta logeado, siempre deja pasar, usar únicamente si el login no es obligatorio

const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
dotenv.config();

module.exports = function (req, res, next) {
    const authHeader = req.headers['authorization'];
    //const token = req.body.token || req.headers["x-access-token"];

    if (!authHeader){
        next()
    } else if (authHeader.startsWith("Bearer ")){
        token = authHeader.substring(7, authHeader.length);

        if (!token) {
            next()
        }
        
        jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    
            if (err) next()
    
            req.user = user
    
            next()
        })
   } else {
      next()
   }  
}