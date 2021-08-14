const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
dotenv.config();

module.exports = function (req, res, next) {
    const authHeader = req.headers['authorization'];
    //const token = req.body.token || req.headers["x-access-token"];

    if (!authHeader){
        return res.status(400).send({ message: 'Token inválido. Vuelva a login.' })
    } else if (authHeader.startsWith("Bearer ")){
        token = authHeader.substring(7, authHeader.length);

        if (!token) {
            return res.status(401).send({ message: 'Inicie sesión para continuar' })
        }
        
        jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    
            if (err) return res.status(403).send({ message: 'Inicie sesión para continuar' })
    
            req.user = user
    
            next()
        })
   } else {
      return res.status(400).send({ message: 'Token inválido. Vuelva a login.' })
   }  
}