const jwt = require('jsonwebtoken');
const db = require('./../../config/db');

class StatisticController {
    // [GET] /statistic/revenue //Thống kê doanh thu các tháng
    revenue(req, res, next) {
        const query = `
            SELECT 
                DATE_FORMAT(ngaydat, '%Y-%m') AS month,
                SUM(tongtien) AS totalRevenue
            FROM 
                hoadon
            GROUP BY 
                DATE_FORMAT(ngaydat, '%Y-%m')
            ORDER BY 
                month;
        `;
        db.query(query, (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            res.json(results);
        });
    }
    // [GET] /statistic/perfumesold //Thống kê số lượng bán ra của từng sản phẩm
    perfumeSold(req, res, next) {
        const query = `
                SELECT nh.*, SUM(cthd.soLuong) AS soLuongBan
                FROM cthoadon AS cthd
                JOIN nuochoa AS nh ON cthd.idNH = nh.idNH
                GROUP BY nh.idNH
                ORDER BY soLuongBan DESC
                `;

        db.query(query, (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            res.json(results);
        });
    }
}
module.exports = new StatisticController();
