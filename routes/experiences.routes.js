const express = require('express');
const checkAuth = require('../middleware/checkAuth.middleware');
const experiencesControllers = require('../controllers/experiences.controllers');
const router = express.Router();

router.get('/getModel/:productID/:modelName', experiencesControllers.getModel);
module.exports = router