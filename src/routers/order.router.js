const express = require('express');
const router = express.Router();

const orderController = require('../app/controllers/OrderController');

router.get('/detail/:orderId', orderController.detail);
router.get('/orderitems', orderController.getOrderItems);
router.get('/search', orderController.search);
router.get('/', orderController.getItems);
// router.get('/', orderController.index);

module.exports = router;
