const express = require('express');
const router = express.Router();

const userController = require('../app/controllers/UserController');

router.get('/creat', userController.creat);
router.post('/create', userController.create);

router.get('/edit/:id', userController.edit);
router.put('/update/:id', userController.update);

router.delete('/delete/:id', userController.softDelete);
router.delete('/deletef/:id', userController.forceDelete);

router.get('/trash', userController.showDeleted);
router.patch('/restore/:id', userController.restore);

router.get('/search', userController.search);

router.get('/:id', userController.show);

router.get('/', userController.index);

module.exports = router;
