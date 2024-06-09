const express = require('express');
const router = express.Router();

const categoryController = require('../app/controllers/CategoryController');
const multer = require('multer');
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'src/assets/img/category/');
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        },
    }),
});
router.post('/create', upload.fields([{ name: 'hinhanh', maxCount: 1 }]), categoryController.createCategory);
router.put('/:id/update', upload.fields([{ name: 'hinhanh', maxCount: 1 }]), categoryController.updateCategory);

router.put('/:id/delete', categoryController.softDelete);
router.delete('/:id/deletef', categoryController.forceDelete);

router.get('/trash', categoryController.showDeleted);
router.put('/:id/restore', categoryController.restore);

router.get('/search', categoryController.search);

router.get('/get-once/:id', categoryController.getCategoryById);

router.get('/', categoryController.getAllCategories);

module.exports = router;
