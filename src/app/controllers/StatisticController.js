const jwt = require('jsonwebtoken');
const db = require('./../../config/db');

class StatisticController {
    // [GET] /statistic/revenue //Thống kê doanh thu các tháng
    revenue(req, res, next) {
        const query = `
            SELECT
                DATE_FORMAT(ngaydat, '%m/%Y') AS month,
                SUM(tongtien) AS totalRevenue
            FROM
                hoadon
            WHERE
                deleted_at IS NULL
            GROUP BY
                DATE_FORMAT(ngaydat, '%m/%Y')
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

    // [GET] /statistic/revenue/:year //Thống kê doanh số các tháng trong các năm
    revenueByYear(req, res, next) {
        const year = req.params.year; // Lấy giá trị năm từ request parameters
        const query = `
        SELECT 
            months.month,
            IFNULL(SUM(hd.tongtien), 0) AS totalRevenue
        FROM 
            (
                SELECT 1 AS month
                UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
                UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
            ) AS months
        LEFT JOIN 
            hoadon hd ON MONTH(hd.ngaydat) = months.month AND YEAR(hd.ngaydat) = ? AND hd.deleted_at IS NULL
        GROUP BY 
            months.month
        ORDER BY 
            months.month;
    `;
        db.query(query, [year], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            res.json(results);
        });
    }

    // [GET] /statistic/perfumerevenue/:year //Thống kê doanh thu các tháng trong các năm
    perfumeRevenueByYear(req, res, next) {
        const year = req.params.year; // Lấy giá trị năm từ request parameters
        const query = `
        SELECT 
            months.month,
            IFNULL(SUM(cthd.soluong), 0) AS totalPerfumeRevenue
        FROM 
            (
                SELECT 1 AS month
                UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
                UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
            ) AS months
        LEFT JOIN 
            hoadon hd ON MONTH(hd.ngaydat) = months.month AND YEAR(hd.ngaydat) = ? AND hd.deleted_at IS NULL
        LEFT JOIN 
            cthoadon cthd ON hd.idHD = cthd.idHD
        LEFT JOIN 
            nuochoa nh ON cthd.idNH = nh.idNH
        GROUP BY 
            months.month
        ORDER BY 
            months.month;
    `;
        db.query(query, [year], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            res.json(results);
        });
    }

    // [GET] /statistic/perfumerevenue //Thống kê số lượng sản phẩm bán ra theo tháng
    perfumeRevenue(req, res, next) {
        const query = `
        SELECT 
            DATE_FORMAT(ngaydat, '%m-%Y') AS month,
            SUM(cthd.soLuong) AS totalProductSold
        FROM 
            hoadon AS hd
        JOIN 
            cthoadon AS cthd ON hd.idHD = cthd.idHD
        WHERE 
            hd.deleted_at IS NULL
        GROUP BY 
            DATE_FORMAT(ngaydat, '%m-%Y')
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

    // [GET] /statistic/perfumesold
    perfumeSold(req, res) {
        const query = `
            SELECT nh.idNH, nh.tenNH, SUM(cthd.soLuong) AS soLuongBan
            FROM cthoadon AS cthd
            JOIN nuochoa AS nh ON cthd.idNH = nh.idNH
            WHERE nh.deleted_at IS NULL
            GROUP BY nh.idNH
            ORDER BY nh.idNH ASC
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
    // [GET] /statistic/customerpurchases // Thống kê tổng số tiền đã mua của từng khách hàng và số lượng nước hoa đã mua của từng khách hàng
    customerPurchases(req, res, next) {
        const query = `
        SELECT 
        kh.idKH,
        kh.tenKH,
        SUM(hd.tongtien) AS totalExpenditure,
        SUM(cthd.totalQuantity) AS totalQuantity
    FROM 
        hoadon AS hd
    JOIN 
        khachhang AS kh ON hd.idKH = kh.idKH
    LEFT JOIN 
        (
            SELECT 
                idHD,
                SUM(soLuong) AS totalQuantity
            FROM 
                cthoadon
            GROUP BY 
                idHD
        ) AS cthd ON hd.idHD = cthd.idHD
    WHERE 
        hd.deleted_at IS NULL
    GROUP BY 
        kh.idKH
    ORDER BY 
        totalExpenditure DESC;
    `;
        db.query(query, (error, results) => {
            if (error) {
                console.error('Lỗi khi thực thi truy vấn MySQL: ', error);
                res.status(500).json({ error: 'Lỗi khi truy vấn dữ liệu', errorCode: 'DB_QUERY_ERROR' });
                return;
            }
            res.json(results);
        });
    }
    // [GET] /statistics/customerexpenditure // Thống kê tổng số tiền đã mua của từng khách hàng
    customerExpenditure(req, res, next) {
        const query = `
        SELECT 
            kh.idKH,
            kh.tenKH,
            SUM(hd.tongtien) AS totalExpenditure
        FROM 
            hoadon AS hd
        JOIN 
            khachhang AS kh ON hd.idKH = kh.idKH
        WHERE 
            hd.deleted_at IS NULL
        GROUP BY 
            kh.idKH
        ORDER BY 
            totalExpenditure DESC;
    `;
        db.query(query, (error, results) => {
            if (error) {
                console.error('Lỗi khi thực thi truy vấn MySQL: ', error);
                res.status(500).json({ error: 'Lỗi khi truy vấn dữ liệu', errorCode: 'DB_QUERY_ERROR' });
                return;
            }
            res.json(results);
        });
    }
    // [GET] /statistic/orders/:month/:year // Lấy ra hóa đơn theo tháng/năm
    ordersByMonthYear(req, res, next) {
        const month = req.params.month; // Lấy giá trị tháng từ request parameters
        const year = req.params.year; // Lấy giá trị năm từ request parameters

        const { sortBy = 'ngaydat', sortOrder = 'desc', page = 1, limit = 9 } = req.query;

        // Tính toán offset
        const offset = (page - 1) * limit;

        const query = `
        SELECT 
            DATE_FORMAT(hd.ngaydat, '%d/%m/%Y') AS date,
            hd.*
        FROM 
            hoadon AS hd
        WHERE 
            MONTH(hd.ngaydat) = ? AND YEAR(hd.ngaydat) = ? AND hd.deleted_at IS NULL
        ORDER BY 
            ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
    `;

        db.query(query, [month, year, parseInt(limit), parseInt(offset)], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }

            const ordersWithDetails = results.map((order) => {
                return new Promise((resolve, reject) => {
                    db.query(
                        'SELECT cthd.*, nh.tenNH, nh.dungtich, nh.hinhanh1 FROM cthoadon AS cthd JOIN nuochoa AS nh ON cthd.idNH = nh.idNH WHERE cthd.idHD = ?',
                        [order.idHD],
                        (detailsError, details) => {
                            if (detailsError) {
                                console.error('Error executing MySQL query: ', detailsError);
                                reject(detailsError);
                            } else {
                                resolve({ ...order, details });
                            }
                        },
                    );
                });
            });

            Promise.all(ordersWithDetails)
                .then((detailedOrders) => {
                    // Đếm tổng số hóa đơn để tính tổng số trang
                    const countQuery = `
                    SELECT COUNT(*) AS count
                    FROM hoadon AS hd
                    WHERE MONTH(hd.ngaydat) = ? AND YEAR(hd.ngaydat) = ? AND hd.deleted_at IS NULL
                `;
                    db.query(countQuery, [month, year], (countError, countResults) => {
                        if (countError) {
                            console.error('Error executing MySQL query: ', countError);
                            res.status(500).json({ error: countError });
                            return;
                        }

                        const totalItems = countResults[0].count;
                        const totalPages = Math.ceil(totalItems / limit);

                        res.json({ orders: detailedOrders, totalPages });
                    });
                })
                .catch((detailsError) => {
                    res.status(500).json({ error: detailsError });
                });
        });
    }

    // [GET] /perfume/
    getAllPerfumes(req, res, next) {
        const { sl, sortBy, sortOrder, minPrice, maxPrice, categoryId, brandId, page = 1, limit = 9 } = req.query;

        // Tính toán offset
        const offset = (page - 1) * limit;

        // Xây dựng truy vấn SQL với điều kiện sắp xếp và phân trang (nếu có)
        let query = 'SELECT * FROM nuochoa WHERE deleted_at IS NULL';
        let queryParams = [];
        if (sl) {
            query += ' AND soluong > 0';
        }
        if (minPrice && maxPrice) {
            query += ' AND giaban BETWEEN ? AND ?';
            queryParams.push(minPrice, maxPrice);
        }
        if (categoryId) {
            query += ' AND idL = ?';
            queryParams.push(categoryId);
        }
        if (brandId) {
            query += ' AND idTH = ?';
            queryParams.push(brandId);
        }
        if (sortBy && sortOrder) {
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
        } else {
            query += ' ORDER BY soluongban DESC';
        }

        query += ' LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        db.query(query, queryParams, (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }

            // Đếm tổng số sản phẩm để tính tổng số trang
            db.query('SELECT COUNT(*) AS count FROM nuochoa WHERE deleted_at IS NULL', (countError, countResults) => {
                if (countError) {
                    console.error('Error executing MySQL query: ', countError);
                    res.status(500).json({ error: countError });
                    return;
                }

                const totalItems = countResults[0].count;
                const totalPages = Math.ceil(totalItems / limit);

                res.json({ products: results, totalPages });
            });
        });
    }
}
module.exports = new StatisticController();
