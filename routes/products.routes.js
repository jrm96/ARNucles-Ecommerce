const express = require('express');
const checkAuth = require('../middleware/checkAuth.middleware');
const verifyAuth = require('../middleware/verifyAuth.middleware');
const productsControllers = require('../controllers/products.controllers');
const router = express.Router();

router.get('/categoryProducts', verifyAuth, productsControllers.categoryProducts);
router.get('/ProductsByTag', checkAuth, productsControllers.ProductsByTag);
router.get('/searchProducts', verifyAuth, productsControllers.searchProducts);
router.get('/image/:productID/:imageID', productsControllers.productImage);
router.get('/info/:productID', productsControllers.productInfo);

module.exports = router