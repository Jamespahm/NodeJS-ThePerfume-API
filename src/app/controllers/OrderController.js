const db = require('./../../config/db');
const jwt = require('jsonwebtoken');

class OrderController {
    // [GET] /order
    getItems(req, res, next) {
        const { sortBy, sortOrder, page = 1, limit = 10 } = req.query;

        // Tính toán offset
        const offset = (page - 1) * limit;

        // Xây dựng truy vấn SQL với điều kiện sắp xếp và phân trang (nếu có)
        let query = 'SELECT * FROM hoadon WHERE deleted_at IS NULL';
        let queryParams = [];

        // if (q) {
        //     query += ' AND tennhan LIKE ?';
        //     queryParams.push(`%${q}%`);
        // }
        if (sortBy && sortOrder) {
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
        } else {
            query += ' ORDER BY tennhan ASC';
        }

        query += ' LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        db.query(query, queryParams, (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }

            // Đếm tổng số hóa đơn để tính tổng số trang
            db.query('SELECT COUNT(*) AS count FROM hoadon WHERE deleted_at IS NULL', (countError, countResults) => {
                if (countError) {
                    console.error('Error executing MySQL query: ', countError);
                    res.status(500).json({ error: countError });
                    return;
                }

                const totalItems = countResults[0].count;
                const totalPages = Math.ceil(totalItems / limit);

                res.json({ orders: results, totalPages });
            });
        });
    }
    // [GET] /order/orderitems
    getOrderItems(req, res, next) {
        const { page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        const tokenUser = req.headers.authorization.split(' ')[1];
        try {
            const decodedToken = jwt.verify(tokenUser, 'your-secret-key');
            const userId = decodedToken.userId;

            db.query(
                'SELECT * FROM hoadon WHERE idKH = ? AND deleted_at IS NULL ORDER BY ngaydat DESC LIMIT ? OFFSET ?',
                [userId, parseInt(limit), parseInt(offset)],
                (error, orders) => {
                    if (error) {
                        console.error('Error executing MySQL query: ', error);
                        res.status(500).json({ error });
                        return;
                    }

                    if (orders.length === 0) {
                        res.status(404).json({ error: 'Không tìm thấy hóa đơn nào' });
                        return;
                    }

                    const ordersWithDetails = orders.map((order) => {
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
                        .then((results) => {
                            db.query(
                                'SELECT COUNT(*) AS count FROM hoadon WHERE idKH = ? AND deleted_at IS NULL',
                                [userId],
                                (countError, countResults) => {
                                    if (countError) {
                                        console.error('Error executing MySQL query: ', countError);
                                        res.status(500).json({ error: countError });
                                        return;
                                    }

                                    const totalItems = countResults[0].count;
                                    const totalPages = Math.ceil(totalItems / limit);

                                    res.json({ orders: results, totalPages });
                                },
                            );
                        })
                        .catch((detailsError) => {
                            res.status(500).json({ error: detailsError });
                        });
                },
            );
        } catch (error) {
            res.status(401).json({ error: 'Token không hợp lệ' });
        }
    }
    // [GET] /order/search
    search(req, res, next) {
        const { sortBy, sortOrder, page, limit, q } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM hoadon WHERE deleted_at IS NULL';
        let queryParams = [];

        if (q) {
            query += ' AND tennhan LIKE ?';
            queryParams.push(`%${q}%`);
        }

        if (sortBy && sortOrder) {
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
        } else {
            query += ' ORDER BY tennhan ASC';
        }

        query += ' LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        db.query(query, queryParams, (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }

            // Count total items for pagination
            let countQuery = 'SELECT COUNT(*) AS count FROM hoadon WHERE deleted_at IS NULL';
            if (q) {
                countQuery += ' AND tennhan LIKE ?';
            }

            db.query(countQuery, queryParams.slice(0, -2), (countError, countResults) => {
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
    // [GET] /order/detail/:orderId
    detail(req, res, next) {
        const orderId = req.params.orderId;

        db.query('SELECT * FROM hoadon WHERE idHD = ?', [orderId], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }

            if (results.length === 0) {
                res.status(404).json({ message: 'Order not found' });
                return;
            }

            const order = results[0];
            db.query(
                'SELECT cthd.*, nh.tenNH, nh.dungtich, nh.hinhanh1 FROM cthoadon AS cthd JOIN nuochoa AS nh ON cthd.idNH = nh.idNH WHERE idHD = ?',
                [orderId],
                (detailsError, details) => {
                    if (detailsError) {
                        console.error('Error executing MySQL query: ', detailsError);
                        res.status(500).json({ error: detailsError });
                        return;
                    }

                    res.json({ order, details });
                },
            );
        });
    }
}

module.exports = new OrderController();