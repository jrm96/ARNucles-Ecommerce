const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('../config/nodemailer.config')
const pool = require('../config/database.config')
const dotenv = require('dotenv');
const validator = require("email-validator");
 
dotenv.config();

const userLogin = (req, res) => {
    try {
        // Get user input
        const email = req.body.email.toUpperCase().trim();
        const password = req.body.password;

        // Validate user input
        if (!(email && password)) {
            res.status(400).send({message: "Todos los campos son requeridos"});
        } else {

            pool.query('SELECT * FROM users WHERE email = $1', [email], (error, results) => {
                if (error) {
                    res.status(400).send({message: "Usuario o contraseña incorrectos."});
                } else {
                    if (results.rowCount == 0) {
                        res.status(400).send({message: "Usuario o contraseña incorrectos."});
                    } else {
                        const hash = results.rows[0].password
                        if (!results.rows[0].status){
                            res.status(403).send({message: "Tiene que confirmar su cuenta con el correo."});
                        } else if (bcrypt.compareSync(password, hash)) {
                            const token = generateAccessToken(results.rows[0].email);
                            res.status(200).send({ token: token })
                        } else {
                            res.status(400).send({message: "Usuario o contraseña incorrectos."});
                        }
                    }
                }
            })
        }
    } catch (err) {
        console.log(err);
        res.status(400).send("Ha ocurrido un error inesperado. Vuelva a intentar o contacte con soporte.");
    }
}

const userRegister = (req, res) => {
    // Our register logic starts here
    try {
        // Get user input
        const username = req.body.username.trim();
        const email = req.body.email.toUpperCase().trim();
        const password = req.body.password;

        // Validate user input
        if (!(email && password && username)) {
            res.status(400).send({message: "Todos los campos son requeridos"});
        }
        else if (!validator.validate(email)){
            res.status(400).send({message: "Correo no valido"});
        }
        else {
            let salt = bcrypt.genSaltSync(10);
            let hash = bcrypt.hashSync(password, salt);


            pool.query('INSERT INTO users(name, email, password) VALUES ($1, $2, $3);', [username, email, hash], (error, results) => {
                if (error) {
                    res.status(409).send({ message: "Usuario ya existe." });
                } else {
                    let confirmationCode = require('crypto').randomBytes(128).toString('hex')
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
}

const userConfirmation = (req, res) => {
    pool.query('DELETE FROM userverification WHERE hash = $1 AND hash_type = $2 RETURNING email;', [req.params.confirmationCode, 1], (error, results) => {
        if (error) {
            // console.log(error);
            res.status(400).send({ message: "No se ha podido validar usuario." });
        } else {
            // console.log(results)
            if (results.rowCount == 0) {
                res.status(404).send({ message: "Usuario no encontrado." });
            } else {
                // console.log(results.rows[0].nickname)
                pool.query('UPDATE public.users SET status= true WHERE email = $1;', [results.rows[0].email], (error, results) => {
                    if (error) {
                        res.status(404).send({ message: "Usuario no encontrado." });
                        console.log(error);
                    } else {
                        if (results.rowCount == 0) {
                            res.status(404).send({ message: "Usuario no encontrado." });
                        } else {
                            res.status(202).send(`Usuario habilitado`);
                        }
                    }
                })
            }
        }
    })
    //res.status(201).send(`Usuario añadido`)
}

const userResetPassword = (req, res) => {
    try {
        // Get user input
        const email = req.body.email;

        // Validate user input
        if (!(email)) {
            res.status(400).send("Todos los campos son requeridos");
        } else {

            pool.query('SELECT name, password FROM users WHERE email = $1', [email], (error, results) => {
                if (error) {
                    res.status(400).send({ message: "Ha ocurrido un problema, intente más tarde o contacte a soporte." });
                } else if (results.rowCount == 0) {
                    res.status(202).send({ message: 'Te hemos enviado un correo para recuperar la contraseña.' });
                } else {
                    let resetCode = require('crypto').randomBytes(128).toString('hex');
                    saveResetCode(resetCode, email);
                    nodemailer.sendResetPasswordEmail(
                        results.rows[0].name,
                        email,
                        resetCode
                    );
                    res.status(202).send({ message: 'Te hemos enviado un correo para recuperar la contraseña.' });
                }
            })
        }
    } catch (err) {
        console.log(err);
        res.status(400).send({ message: "Ha ocurrido un problema, intente más tarde o contacte a soporte." });
    }
}

const userNewPassword = (req, res) => {
    pool.query('DELETE FROM userverification WHERE hash = $1 AND hash_type = $2 RETURNING email, hash_date;', [req.params.confirmationCode, 2], (error, results) => {
        if (error) {
            // console.log(error);
            res.status(400).send({ message: "No se ha podido cambiar contraseña." });
        } else if (results.rowCount == 0) {
            res.status(404).send({ message: "No se ha podido cambiar contraseña." });
        } else {
            // console.log(results.rows[0].nickname)
            const fechaSolicitud = results.rows[0].hash_date
            pool.query('UPDATE public.users SET status= true WHERE email = $1;', [results.rows[0].email], (error, results) => {
                if (error) {
                    res.status(404).send({ message: "Usuario no encontrado." });
                    console.log(error);
                } else {
                    if (results.rowCount == 0) {
                        res.status(404).send({ message: "Usuario no encontrado." });
                    } else {
                        res.status(202).send(`Usuario habilitado`);
                    }
                }
            })
        }
    })
    //res.status(201).send(`Usuario añadido`)
}

const getInfo = (req, res) => {
    try {
        const email = req.user.email;

        // Validate user input
        if (!(email)) {
            res.status(400).send("Todos los campos son requeridos");
        } else {
            pool.query('select u."name", u.phone, u.user_image, u.gender, u.birth from users u where u.email = $1', [email], (error, results) => {
                if (error) {
                    res.status(400).send({message: 'Error al obtener información del usuario'});
                } else {
                    if (results.rowCount == 0) {
                        res.status(205).send({message: 'No se ha encontrado usuario.'}); //Codigo 205 para indicar que se borre token
                    } else {
                        res.status(200).send(results.rows[0])
                    }
                }
            })
        }
    } catch (err) {
        console.log(err);
        res.status(400).send("Ha ocurrido un error inesperado. Vuelva a intentar o contacte con soporte.");
    }
}

const updateInfo = (req, res) => {
    try {
        const email = req.user.email;
        const { username, phone, gender, birth} = req.body;

        // Validate user input
        if (!(email && username && phone && gender && birth)) {
            res.status(400).send("Todos los campos son requeridos");
        } else {
            pool.query(`UPDATE public.users
            SET "name" = $1, phone = $2, gender = $3, birth = $4
            WHERE email = $5;`, [username, phone, gender, birth, email], (error, results) => {
                if (error) {
                    res.status(400).send({message: 'No se ha podido actualizar información.'});
                } else {
                    if (results.rowCount == 0) {
                        res.status(205).send({message: 'No se ha encontrado usuario.'}); //Codigo 205 para indicar que se borre token
                    } else {
                        res.status(200).send({message: 'Información actualizada correctamente.'})
                    }
                }
            })
        }
    } catch (err) {
        console.log(err);
        res.status(400).send("Ha ocurrido un error inesperado. Vuelva a intentar o contacte con soporte.");
    }
}

const getImage = (req, res) => {
    try {
        const email = req.user.email     
        if (!(email)) {
            res.status(400).send("Todos los campos son requeridos");
        } else {
            pool.query('select u.user_image from users u where u.email = $1', [email], (error, results) => {
                if (error) {
                    res.status(400).send({message: 'Error al obtener imagen del usuario'});
                } else {
                    if (results.rowCount == 0) {
                        res.status(205).send({message: 'No se ha encontrado usuario.'}); //Codigo 205 para indicar que se borre token
                    } else {
                        filePath = `./media/users/${email}/img/`
                        res.status(200).sendFile(results.rows[0].user_image, { root: filePath }, function (err) {
                            if (err) {
                                res.status(400).send("Ha ocurrido un error inesperado. Vuelva a intentar o contacte con soporte.");
                            } 
                        })
                    }
                }
            })
        }
    } catch (err) {
        console.log(err);
        res.status(400).send("Ha ocurrido un error inesperado. Vuelva a intentar o contacte con soporte.");
    }
}

const getOrders = (req, res) => {
    try {
        const email = req.user.email;

        // Validate user input
        if (!(email)) {
            res.status(400).send("Todos los campos son requeridos");
        } else {
            pool.query('select * from orders o where o.order_user = $1 order by o.order_user, o.order_date desc', [email], (error, results) => {
                if (error) {
                    res.status(400).send({message: 'Error al obtener órdenes.'});
                } else {
                    if (results.rowCount == 0) {
                        res.status(204).send({message: 'No se han encontrado órdenes.'}); 
                    } else {
                        orders = {orders: results.rows}
                        res.status(200).send(orders)
                    }
                }
            })
        }
    } catch (err) {
        console.log(err);
        res.status(400).send("Ha ocurrido un error inesperado. Vuelva a intentar o contacte con soporte.");
    }
}

const addToWL = (req, res) => {
    try {
        const email = req.user.email;
        const productID = req.body.productID

        // Validate user input
        if (!(email && productID)) {
            res.status(400).send("Todos los campos son requeridos");
        } else {
            pool.query(`INSERT INTO public.wishlist
            (user_email, product_id) VALUES($1, $2);`, [email, productID], (error, results) => {
                if (error) {
                    res.status(400).send({ message: "Ha ocurrido un error al agregar producto." });
                } else {
                    res.status(201).send({message: `Producto añadido a Lista de deseos.`});
                }
            })
        }
    } catch (err) {
        console.log(err);
    }
}

const getWL = (req, res) => {
    try {
        const email = req.user.email;

        // Validate user input
        if (!email) {
            res.status(400).send({message: "No se puede obtener usuario"});
        } else {
            pool.query(`select w.product_id, w.added_date from wishlist w where w.user_email = $1`, [email], (error, results) => {
                if (error) {
                    res.status(400).send({ message: "No se ha podido obtener WL." });
                } else {
                    if (results.rowCount == 0) {
                        res.status(204).send({message: 'No hay productos en WL.'}); 
                    } else {
                        
                        products = {products: results.rows}
                        res.status(200).send(products)
                    }
                }
            })
        }
    } catch (err) {
        console.log(err);
    }
}

const removeItemWL = (req, res) => {
    try {
        const email = req.user.email;
        const productID = req.body.productID

        // Validate user input
        if (!(email && productID)) {
            res.status(400).send("Todos los campos son requeridos");
        } else {
            pool.query(`DELETE FROM public.wishlist
            WHERE user_email = $1 AND product_id = $2;`, [email, productID], (error, results) => {
                if (error) {
                    res.status(400).send({ message: "Ha ocurrido un error al eliminar producto." });
                } else {
                    res.status(201).send({message: `Producto removido de Lista de deseos.`});
                }
            })
        }
    } catch (err) {
        console.log(err);
    }
}

const addToCart = (req, res) => {
    try {
        const email = req.user.email;
        const productID = req.body.productID;
        const amountItems = req.body.amountItems;

        // Validate user input
        if (!(email && productID)) {
            res.status(400).send("Todos los campos son requeridos");
        } else {
            pool.query(`INSERT INTO public.cart
            ("user", product, amount)
            VALUES($1, $2, $3);`, [email, productID, amountItems], (error, results) => {
                if (error) {
                    res.status(400).send({ message: "Ha ocurrido un error al agregar producto." });
                } else {
                    res.status(201).send({message: `Producto añadido a Carrito.`});
                }
            })
        }
    } catch (err) {
        console.log(err);
    }
}

const getCart = (req, res) => {
    try {
        const email = req.user.email;

        // Validate user input
        if (!email) {
            res.status(400).send({message: "No se puede obtener usuario"});
        } else {
            pool.query(`select c.product, c.amount, c.added_date from public.cart c where w.user = $1`, [email], (error, results) => {
                if (error) {
                    res.status(400).send({ message: "No se ha podido obtener Carrito." });
                } else {
                    if (results.rowCount == 0) {
                        res.status(204).send({message: 'No hay productos en Carrito.'}); 
                    } else {
                        
                        products = {products: results.rows}
                        res.status(200).send(products)
                    }
                }
            })
        }
    } catch (err) {
        console.log(err);
    }
}

const removeItemCart = (req, res) => {
    try {
        const email = req.user.email;
        const productID = req.body.productID

        // Validate user input
        if (!(email && productID)) {
            res.status(400).send("Todos los campos son requeridos");
        } else {
            pool.query(`DELETE FROM public.cart
            WHERE user = $1 AND product = $2;`, [email, productID], (error, results) => {
                if (error) {
                    res.status(400).send({ message: "Ha ocurrido un error al eliminar producto." });
                } else {
                    res.status(201).send({message: `Producto removido de Lista de deseos.`});
                }
            })
        }
    } catch (err) {
        console.log(err);
    }
}

//Generar token de acceso
function generateAccessToken(email) {
    return jwt.sign({ email: email }, process.env.TOKEN_SECRET, { expiresIn: '360d' });
}

function saveConfirmationCode(confirmationCode, email) {
    pool.query('INSERT INTO public.userverification(email, hash, hash_type) VALUES ($1, $2, $3);', [email, confirmationCode, 1], (error, results) => {
        if (error) {
            console.log(error);
            return 0;
        } else {
            return 1
        }
    })
}

function saveResetCode(resetCode, email) {
    pool.query('INSERT INTO public.userverification(email, hash, hash_type) VALUES ($1, $2, $3);', [email, confirmationCode, 2], (error, results) => {
        if (error) {
            console.log(error);
            return 0;
        } else {
            return 1
        }
    })
}

module.exports = {
    userLogin,
    userRegister,
    userConfirmation,
    userResetPassword,
    getInfo,
    getImage,
    updateInfo,
    getOrders,
    addToWL,
    getWL,
    removeItemWL,
    addToCart,
    getCart,
    removeItemCart,
}