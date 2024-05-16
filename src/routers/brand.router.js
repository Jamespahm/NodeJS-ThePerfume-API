const express = require('express');
const router = express.Router();

const brandController = require('../app/controllers/BrandController');

router.get('/creat', brandController.creat);
router.post('/create', brandController.create);

router.get('/edit/:id', brandController.edit);
router.put('/update/:id', brandController.update);

router.delete('/delete/:id', brandController.softDelete);
router.delete('/deletef/:id', brandController.forceDelete);

router.get('/trash', brandController.showDeleted);
router.patch('/restore/:id', brandController.restore);

router.get('/search', brandController.search);

router.get('/:id', brandController.show);

router.get('/', brandController.index);

module.exports = router;
