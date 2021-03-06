const pool = require('../config/database.config')
const dotenv = require('dotenv');
dotenv.config();

const categoryProducts = (req, res) => {
    try {
        if (req.user){
            var email = req.user.email;
        }
        var query = ''
        var parametros = ''
        if (!email) {
            query = `select c.category_id, c.category_name, (
                select array_agg(json_build_object(
                            'product_id',p.product_id ,
                            'product_name', p.product_name ,
                            'product_price', p.product_price,
                            'image', coalesce((select 'https://' ||$1 || '/products/image/' || i.product::varchar(20) || '/' || i.image_id::varchar(100) from product_images i where p.product_id = i.product limit 1),''),
                            'experience_url', coalesce('https://' ||$1 || '/experiences/getModel/' || p.product_id::varchar(20) || '/' || pe.experience_model, ''),
                            'model_width', coalesce(pe.width, 0),
                            'model_long', coalesce(pe.long, 0),
                            'model_height', coalesce(pe.height,0)
                )) as products from products p 
                left join (
                    select distinct on (product)
                    product, experience_model, width, long, height from product_experience 
                ) pe
                on p.product_id = pe.product
                where p.category = c.category_id and p.product_active is true 
                limit 10 
            )
            from category c 
            where c.category_parent is null 
            limit 10`;
            parametros = [process.env.HOST];
        } else {
            query = `select c.category_id, c.category_name, (
                select array_agg(json_build_object(
                            'product_id',p.product_id ,
                            'product_name', p.product_name ,
                            'product_price', p.product_price,
                            'image', coalesce((select 'https://' ||$1 || '/products/image/' || i.product::varchar(20) || '/' || i.image_id::varchar(100) from product_images i where p.product_id = i.product limit 1),''),
                            'experience_url', coalesce('https://' ||$1 || '/experiences/getModel/' || p.product_id::varchar(20) || '/' || pe.experience_model, ''),
                            'model_width', coalesce(pe.width, 0),
                            'model_long', coalesce(pe.long, 0),
                            'model_height', coalesce(pe.height,0)
                )) as products from products p 
                left join (
                    select distinct on (product)
                    product, experience_model, width, long, height from product_experience 
                ) pe
                on p.product_id = pe.product
                where p.category = c.category_id and p.product_active is true and p.product_id in (select pc.producs_product_id from products_country pc 
    where pc.country_id in (select d.country from "Delivery" d where d.email = $2 and d.active is true)
    )
                limit 10 
            )
            from category c 
            where c.category_parent is null 
            limit 10`;
            parametros = [process.env.HOST, email];
        }

        pool.query(query, parametros, (error, results) => {
            if (error) {
                console.log(error.stack)
                res.status(400).send("Ha ocurrido un error inesperado. Vuelva a intentar o contacte con soporte.");
            } else {
                resultado = { categories: results.rows }
                res.status(200).send(resultado);
            }
        })
    } catch (err) {
        console.log(err);
        res.status(400).send("Ha ocurrido un error inesperado. Vuelva a intentar o contacte con soporte.");
    }
}

const ProductsByTag = (req, res) => {
    try {
        const email = req.user.email;
        const all = req.query.all;

        // Validate user input
        if (!email) {
            res.status(400).send({ message: "No se puede obtener usuario" });
        } else {
            let limit = 10
            if (all == 1){
                limit = 100
            }

            pool.query(`select * from (
            SELECT distinct on (p.product_id) 
                    p.product_id, p.product_name, p.product_price, coalesce((select 'https://' ||$1 || '/products/image/' || i.product::varchar(20) || '/' || i.image_id::varchar(100) from product_images i where p.product_id = i.product limit 1),'') as image,
                    coalesce('https://' ||$1 || '/experiences/getModel/' || p.product_id::varchar(20) || '/' || pe.experience_model, '') as experience_url, coalesce(pe.width, 0) as model_width, coalesce(pe.long, 0) as model_long, coalesce(pe.height,0) as model_height 
            FROM (
                    select p.*, count(*) as tags 
                    from products p 
                    inner join product_tags pt 
                    on p.product_id = pt.product_id 
                    where pt.tag_id in (select ut.tag_id from user_tags ut where ut.user_email = $2)
                    group by p.product_id 
                ) p 
            left join product_experience pe 
            on p.product_id = pe.product 
            ) a order by random() limit $3`, [process.env.HOST, email, limit], (error, results) => {
                if (error) {
                    console.log(error.stack)
                    res.status(400).send("Ha ocurrido un error inesperado. Vuelva a intentar o contacte con soporte.");
                } else {
                    resultado = { categories: results.rows }
                    res.status(200).send(resultado);
                }
            })
        }
    } catch (err) {
        console.log(err);
        res.status(400).send("Ha ocurrido un error inesperado. Vuelva a intentar o contacte con soporte.");
    }
}

const searchProducts = (req, res) => {
    try {
        let searchText = req.query.searchText
        let device = ''
        if (!searchText) {
            return res.status(400).send({ message: 'Se requiere texto de b??squeda.' })
        } else {
            if (req.user){
                var email = req.user.email;
            }
            var query = ''
            var parametros = ''
            if (!email) {
                query = `SELECT distinct on (p.product_id) 
                p.product_id, p.product_name, p.product_price, coalesce((select 'https://' ||$2 || '/products/image/' || i.product::varchar(20) || '/' || i.image_id::varchar(100) from product_images i where p.product_id = i.product limit 1),'') as image,
                coalesce('https://' ||$2 || '/experiences/getModel/' || p.product_id::varchar(20) || '/' || pe.experience_model, '') as experience_url, coalesce(pe.width, 0) as model_width, coalesce(pe.long, 0) as model_long, coalesce(pe.height,0) as model_height 
                FROM products p 
                left join product_experience pe 
                on p.product_id = pe.product 
                WHERE p.product_name ~* $1 limit 20`;
                parametros = [searchText, process.env.HOST];
            } else {
                query = `SELECT distinct on (p.product_id) 
                p.product_id, p.product_name, p.product_price, coalesce((select 'https://' ||$2 || '/products/image/' || i.product::varchar(20) || '/' || i.image_id::varchar(100) from product_images i where p.product_id = i.product limit 1),'') as image,
                coalesce('https://' ||$2 || '/experiences/getModel/' || p.product_id::varchar(20) || '/' || pe.experience_model, '') as experience_url, coalesce(pe.width, 0) as model_width, coalesce(pe.long, 0) as model_long, coalesce(pe.height,0) as model_height 
                FROM products p 
                left join product_experience pe 
                on p.product_id = pe.product 
                WHERE p.product_id in (
                    select pc.producs_product_id from products_country pc 
                    where pc.country_id in (select d.country from "Delivery" d where d.email = $3 and active is true)
                ) and p.product_name ~* $1 limit 20`;
                parametros = [searchText, process.env.HOST, email];
            }
            searchText = `\\y${searchText}\\y`
            pool.query(query, parametros, (error, results) => {
                if (error) console.log(error.stack)
                saveSearch(searchText, email, device)
                if (results.rowCount == 0) {
                    res.status(204).send({ mensaje: 'No se han encontrado productos' });
                } else {
                    resultado = { products: results.rows }
                    res.status(200).send(resultado);
                }
            })
        }
    } catch (err) {
        console.log(err);
        res.status(400).send("Ha ocurrido un error inesperado. Vuelva a intentar o contacte con soporte.");
    }
}

const productImage = (req, res) => {
    try {
        const productID = req.params.productID
        const imageID = req.params.imageID
        if (!(imageID && productID)) {
            return res.status(400).send({ message: 'Se requiere nombre de imagen y producto.' })
        }
        filePath = `./media/products/${productID}/img/`
        res.status(200).sendFile(imageID, { root: filePath }, function (err) {
            if (err) {
                res.status(400).send("Ha ocurrido un error inesperado. Vuelva a intentar o contacte con soporte.");
            }
        })
    } catch (err) {
        console.log(err);
        res.status(400).send("Ha ocurrido un error inesperado. Vuelva a intentar o contacte con soporte.");
    }
}

const productInfo = (req, res) => {
    try {
        const productID = req.params.productID
        if (!productID) {
            return res.status(400).send({ message: 'Ha ocurrido un error.' })
        }
        pool.query(`select p.product_name, p.product_desc, p.product_active as avalaible, p.product_price, p.product_calification, p.reviews, 
                    c."name" as company_name, c.company_address, c.company_address, c2."name" as country_name, s.state_name, c3.city_name 
                    from products p
                    inner join company c 
                    on c.id = p.company 
                    left join country c2 
                    on c.country = c2.id 
                    left join state s 
                    on ((s.country_id = c.country) and (s.state_id = c.state))
                    left join city c3 
                    on ((c3.country_id = c.country) and (c3.state_id = c.state) and (c3.city_id = c.city))
                    where p.product_id = $1`,
            [productID], (error, results) => {
                if (error) console.log(error.stack)
                if (results.rowCount == 0) {
                    res.status(204).send({ mensaje: 'No se han encontrado productos' });
                } else {
                    resultado = { products: results.rows }
                    res.status(200).send(resultado);
                }
            })
    } catch (err) {
        console.log(err);
        res.status(400).send("Ha ocurrido un error inesperado. Vuelva a intentar o contacte con soporte.");
    }
}

function saveSearch(searchText, email, device) {
    try {
    pool.query(`INSERT INTO public.searching
        ("search", search_user, device_system)
        VALUES($1, $2, $3);`, [searchText, email, device], (error, results) => {
        if (error) console.log(error.stack)
    })
    } catch (e){
        console.log(e)
    }
}

module.exports = {
    categoryProducts,
    searchProducts,
    productImage,
    productInfo,
    ProductsByTag,
}