const express = require('express');
const router = express.Router();

const perfumeController = require('../app/controllers/PerfumeController');

router.get('/create', perfumeController.create);
router.post('/store', perfumeController.store);

router.get('/edit/:id', perfumeController.edit);
router.put('/update/:id', perfumeController.update);

router.delete('/delete/:id', perfumeController.softDelete);
router.delete('/deletef/:id', perfumeController.forceDelete);

router.get('/trash', perfumeController.showDeleted);
router.patch('/restore/:id', perfumeController.restore);

router.get('/search', perfumeController.search);

router.get('/:slug', perfumeController.show);

router.get('/', perfumeController.index);

module.exports = router;
