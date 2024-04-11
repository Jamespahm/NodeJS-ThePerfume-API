const express = require('express');
const router = express.Router();

const perfumeController = require('../app/controllers/PerfumeController');

router.get('/search', perfumeController.search);

router.get('/', perfumeController.index);

module.exports = router;
