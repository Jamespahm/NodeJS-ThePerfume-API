const express = require('express');
const router = express.Router();

const orderController = require('../app/controllers/OrderController');

router.put('/:id/delete', orderController.softDeleteOrder);
router.delete('/:id/deletef', orderController.forceDeleteOrder);

router.get('/trash', orderController.getOrdersDeleted);
router.put('/:id/restore', orderController.restoreOrder);

router.get('/detail/:orderId', orderController.getDetailOrder);
router.put('/update/:orderId', orderController.updateOrder);
router.get('/search', orderController.search);

router.get('/orderitems', orderController.getOrderItems);

router.get('/get-once/:id', orderController.getOrderById);
router.get('/', orderController.getItems);

module.exports = router;
