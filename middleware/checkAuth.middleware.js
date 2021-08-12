const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
dotenv.config();

module.exports = function (req, res, next) {
    const token = req.body.token || req.query.token || req.headers["x-access-token"];

    if (!token) {
        return res.status(401).send({ message: 'Inicie sesión para continuar' })
    }
    
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {

        if (err) return res.status(403).send({ message: 'Inicie sesión para continuar' })

        req.user = user

        next()
    })
}