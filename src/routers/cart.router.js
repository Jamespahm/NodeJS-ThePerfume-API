const express = require('express');
const router = express.Router();
const cartController = require('../app/controllers/CartController');

router.get('/items', cartController.getCartItems);
router.delete('/items/:cartItemId/delete', cartController.deleteCartItem);
router.post('/add', cartController.addCartItem);
router.put('/items/:itemId/increase', cartController.increaseCartItem);
router.put('/items/:itemId/decrease', cartController.decreaseCartItem);
// router.post('/checkout', cartController.checkoutCart);

module.exports = router;
