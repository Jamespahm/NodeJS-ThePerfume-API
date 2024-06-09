const express = require('express');
const router = express.Router();

const orderController = require('../app/controllers/OrderController');

router.put('/:id/delete', orderController.softDeleteOrder);
router.delete('/:id/deletef', orderController.forceDeleteOrder);

router.get('/trash', orderController.getOrdersDeleted);
router.put('/:id/restore', orderController.restoreOrder);

router.get('/detail/:orderId', orderController.getDetailOrder);
router.put('/update/:orderId', orderController.updateOrder);
router.put('/cancel/:orderId', orderController.cancelOrder);
router.get('/search', orderController.search);

router.get('/orderitems', orderController.getOrderItemsByToken);
router.get('/orderitems/:userId', orderController.getOrderItemsByUserId);

router.get('/get-once/:id', orderController.getOrderById);
router.get('/', orderController.getAllOrders);

module.exports = router;
