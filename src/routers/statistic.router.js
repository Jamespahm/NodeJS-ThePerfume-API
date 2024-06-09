const express = require('express');
const router = express.Router();

const statisticController = require('../app/controllers/StatisticController');

router.get('/revenue/:year', statisticController.revenueByYear);
router.get('/revenue', statisticController.revenue);

router.get('/perfumerevenue/:year', statisticController.perfumeRevenueByYear);
router.get('/perfumerevenue', statisticController.perfumeRevenue);

router.get('/perfumesold', statisticController.perfumeSold);

router.get('/customerexpenditure', statisticController.customerExpenditure); // Thống kê tổng số tiền đã mua của từng khách hàng và số tiền đã chi tiêu của từng khách hàng
router.get('/customerpurchases', statisticController.customerPurchases); // Thống kê tổng số tiền đã mua của từng khách hàng và số lượng nước hoa đã mua của từng khách hàng
router.get('/orders/:month/:year', statisticController.ordersByMonthYear); // Thống kê hóa đơn theo tháng/năm
module.exports = router;
