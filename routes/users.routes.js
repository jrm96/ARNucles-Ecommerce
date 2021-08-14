const express = require('express');
const checkAuth = require('../middleware/checkAuth.middleware');
const userControllers = require('../controllers/users.controllers');
const router = express.Router();

router.post('/register', userControllers.userRegister);
router.post('/login', userControllers.userLogin);
router.get('/confirm/:confirmationCode', userControllers.userConfirmation);
router.post('/ResetPassword', userControllers.userResetPassword);
//router.post('/newPassword/:resetCode', userControllers.userConfirmation);
router.get('/getInfo', checkAuth, userControllers.getInfo);
router.get('/getImage', checkAuth, userControllers.getImage);
router.put('/updateInfo', checkAuth, userControllers.updateInfo);
router.get('/getOrders', checkAuth, userControllers.getOrders);
router.post('/addToWL', checkAuth, userControllers.addToWL);
router.delete('/removeItemWL', checkAuth, userControllers.removeItemWL);
router.get('/getWL', checkAuth, userControllers.getWL);

//router.get('/me', checkAuth, userControllers.getMe); 

module.exports = router