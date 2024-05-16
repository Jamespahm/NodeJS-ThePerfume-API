const express = require('express');
const router = express.Router();

const categoryController = require('../app/controllers/CategoryController');

router.get('/creat', categoryController.creat);
router.post('/create', categoryController.create);

router.get('/edit/:id', categoryController.edit);
router.put('/update/:id', categoryController.update);

router.delete('/delete/:id', categoryController.softDelete);
router.delete('/deletef/:id', categoryController.forceDelete);

router.get('/trash', categoryController.showDeleted);
router.patch('/restore/:id', categoryController.restore);

router.get('/search', categoryController.search);

router.get('/:id', categoryController.show);

router.get('/', categoryController.index);

module.exports = router;
