const express = require('express');
const router = express.Router();
const favouriteController = require('../app/controllers/FavouriteController');

router.get('/items', favouriteController.getItems);
router.delete('/items/:favItemId/delete', favouriteController.deleteItem);
router.post('/add', favouriteController.addItem);

module.exports = router;
