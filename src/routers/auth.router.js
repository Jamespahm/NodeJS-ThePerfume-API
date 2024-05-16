const express = require('express');
const router = express.Router();

const authController = require('../app/controllers/AuthController');

router.post('/login', authController.login);
// router.get('/cart', authController.getCartItems);

module.exports = router;
