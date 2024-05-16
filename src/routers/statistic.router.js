const express = require('express');
const router = express.Router();

const statisticController = require('../app/controllers/StatisticController');

router.post('/revenue', statisticController.revenue);
router.get('/perfumesold', statisticController.perfumeSold);

module.exports = router;
