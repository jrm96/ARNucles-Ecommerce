const pool = require('../config/database.config')
const dotenv = require('dotenv');
dotenv.config();

const getModel = (req, res) => {
    try {
        const productID = req.params.productID;
        const modelName = req.params.modelName;
        if (!(modelName && productID)){
            return res.status(400).send({message : 'Se requiere nombre de imagen y producto.'});
        }
        filePath = `./media/products/${productID}/model/`;
        res.status(200).sendFile(modelName, { root: filePath }, function (err) {
            if (err) {
                res.status(400).send({message: "No se ha encontrado el modelo. Vuelva a intentar o contacte con soporte."});
            } else {
                saveView(req);
            }
          })
    } catch (err) {
        console.log(err);
        res.status(400).send({message: "Ha ocurrido un error inesperado. Vuelva a intentar o contacte con soporte."});
    }
}

function saveView(req){
    pool.query(`INSERT INTO public.experience_views
    (product, email, experience, device_system, second_product)
    VALUES($1, $2, $3, $4, $5);`, [req.params.productID, req.user, req.params.modelName, req.body.deviceSystem,  req.body.second_product], (error, results) => {
        if (error) console.log(error.stack)
    })
}

module.exports = {
    getModel,
}