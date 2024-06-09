const express = require('express');
const router = express.Router();

const perfumeController = require('../app/controllers/PerfumeController');
const multer = require('multer');
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'src/assets/img/products/');
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        },
    }),
});
router.post(
    '/add',
    upload.fields([
        { name: 'hinhanh1', maxCount: 1 },
        { name: 'hinhanh2', maxCount: 1 },
        { name: 'hinhanh3', maxCount: 1 },
        { name: 'hinhanh4', maxCount: 1 },
    ]),
    perfumeController.addPerfume,
);

router.put(
    '/:id/update',
    upload.fields([
        { name: 'hinhanh1', maxCount: 1 },
        { name: 'hinhanh2', maxCount: 1 },
        { name: 'hinhanh3', maxCount: 1 },
        { name: 'hinhanh4', maxCount: 1 },
    ]),
    perfumeController.updatePerfume,
);

router.put('/:id/delete', perfumeController.softDeletePerfume);
router.delete('/:id/deletef', perfumeController.forceDeletePerfume);

router.get('/trash', perfumeController.getPerfumesDeleted);
router.put('/:id/restore', perfumeController.restorePerfume);

router.get('/sales', perfumeController.hotSales);
router.get('/newest', perfumeController.getNewestPerfumes);

router.get('/search', perfumeController.searchPerfumes);

router.get('/related/:slug', perfumeController.getRelatedPerfumes); // New route for related perfumes
router.get('/get-once/:id', perfumeController.getPerfumeById);
router.get('/:slug', perfumeController.getPerfumeBySlug);

// router.post('/upload', perfumeController.uploadImage);

router.get('/', perfumeController.getAllPerfumes);

module.exports = router;
