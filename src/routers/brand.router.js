const express = require('express');
const router = express.Router();

const brandController = require('../app/controllers/BrandController');
const multer = require('multer');
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'src/assets/img/banner/');
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        },
    }),
});
router.post('/create', upload.fields([{ name: 'hinhanh', maxCount: 1 }]), brandController.createBrand);
router.put('/:id/update', upload.fields([{ name: 'hinhanh', maxCount: 1 }]), brandController.updateBrand);

router.get('/get-once/:id', brandController.getBrandById);

router.put('/:id/delete', brandController.softDelete);
router.delete('/:id/deletef', brandController.forceDelete);

router.get('/trash', brandController.showDeleted);
router.put('/:id/restore', brandController.restore);

router.get('/search', brandController.search);

router.get('/', brandController.getAllBrands);

module.exports = router;
