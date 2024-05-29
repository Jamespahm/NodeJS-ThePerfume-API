const express = require('express');
const router = express.Router();

const paymentController = require('../app/controllers/PaymentController');

router.post('/checkout', paymentController.checkoutCart);
router.post('/checkoutSingle', paymentController.checkoutSingleProduct);

module.exports = router;
