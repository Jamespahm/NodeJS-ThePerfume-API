const express = require('express');
const router = express.Router();

const paymentController = require('../app/controllers/PaymentController');

router.post('/checkout', paymentController.checkoutCart);
// router.get('/cart', authController.getCartItems);

module.exports = router;
