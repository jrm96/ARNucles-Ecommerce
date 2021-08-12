const express = require('express');
const checkAuth = require('../middleware/checkAuth.middleware');
const productsControllers = require('../controllers/products.controllers');
const router = express.Router();

router.get('/categoryProducts', productsControllers.categoryProducts);
router.get('/searchProducts', productsControllers.searchProducts);
router.get('/image/:productID/:imageID', productsControllers.productImage);
router.get('/info', productsControllers.productInfo);

module.exports = router