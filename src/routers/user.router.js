const express = require('express');
const router = express.Router();

const userController = require('../app/controllers/UserController');
const multer = require('multer');
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'src/assets/img/user-avt/');
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        },
    }),
});
router.post('/create', upload.fields([{ name: 'avatar', maxCount: 1 }]), userController.createUser);
router.put('/:id/update', upload.fields([{ name: 'avatar', maxCount: 1 }]), userController.updateUser);

router.get('/get-once/:id', userController.getUserById);

router.put('/delete/:id', userController.softDelete);
router.delete('/:id/deletef', userController.forceDelete);

router.get('/trash', userController.showDeleted);
router.put('/:id/restore', userController.restore);

router.get('/search', userController.search);

router.get('/profile', userController.getProfile);
router.put('/profile', upload.fields([{ name: 'avatar', maxCount: 1 }]), userController.updateProfile);

router.get('/', userController.index);

module.exports = router;
