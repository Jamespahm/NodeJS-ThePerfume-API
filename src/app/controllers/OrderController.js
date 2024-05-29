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
    // [GET] /order/get-once/:id
    getOrderById(req, res, next) {
        // Lấy giá trị của slug từ request
        const id = req.params.id;
        // Thực hiện truy vấn SQL để lấy bản ghi với id tương ứng
        db.query('SELECT * FROM hoadon WHERE idHD = ?', [id], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            // Kiểm tra xem có bản ghi nào được tìm thấy hay không
            if (results.length === 0) {
                res.status(404).json({ error: 'Không tìm thấy bản ghi với id này' });
                return;
            }
            // Trả về bản ghi được tìm thấy
            res.json(results[0]);
        });
    }
    // [GET] /order/orderitems
    getOrderItems(req, res, next) {
        const { userId, page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

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
    }
    // [GET] /order/search
    search(req, res, next) {
        const { sortBy, sortOrder, page, limit, q } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM hoadon WHERE deleted_at IS NULL';
        let queryParams = [];

        if (q) {
            query +=
                ' AND tennhan LIKE ? or sdtnhan LIKE ? or diachinhan LIKE ? or ngaydat LIKE ? or thanhtoan LIKE ? or trangthai LIKE ?';
            queryParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
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
                countQuery +=
                    ' AND tennhan LIKE ? or sdtnhan LIKE ? or diachinhan LIKE ? or ngaydat LIKE ? or thanhtoan LIKE ? or trangthai LIKE ?';
            }

            db.query(countQuery, queryParams.slice(0, -2), (countError, countResults) => {
                if (countError) {
                    console.error('Error executing MySQL query: ', countError);
                    res.status(500).json({ error: countError });
                    return;
                }

                const totalItems = countResults[0].count;
                const totalPages = Math.ceil(totalItems / limit);

                res.json({ results, totalPages });
            });
        });
    }

    // [GET] /order/detail/:orderId
    getDetailOrder(req, res, next) {
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
    // [PUT] /order/update/:orderId
    updateOrder(req, res, next) {
        const orderId = req.params.orderId;
        const { order, details } = req.body;

        // Bắt đầu một transaction để đảm bảo tính nhất quán của cơ sở dữ liệu
        db.beginTransaction((transactionError) => {
            if (transactionError) {
                console.error('Error starting transaction: ', transactionError);
                res.status(500).json({ error: transactionError });
                return;
            }

            // Cập nhật thông tin hóa đơn
            db.query(
                'UPDATE hoadon SET tennhan = ?, sdtnhan = ?, diachinhan = ?, tongtien = ?, thanhtoan = ?, trangthai = ? WHERE idHD = ?',
                [
                    order.tennhan,
                    order.sdtnhan,
                    order.diachinhan,
                    order.tongtien,
                    order.thanhtoan,
                    order.trangthai,
                    orderId,
                ],
                (orderError) => {
                    if (orderError) {
                        return db.rollback(() => {
                            console.error('Error executing MySQL query: ', orderError);
                            res.status(500).json({ error: orderError });
                        });
                    }

                    // Cập nhật chi tiết hóa đơn
                    const updateDetailPromises = details.map((detail) => {
                        return new Promise((resolve, reject) => {
                            db.query(
                                'UPDATE cthoadon SET soLuong = ?, giaban = ? WHERE idCTHD = ?',
                                [detail.soLuong, detail.giaban, detail.idCTHD],
                                (detailError) => {
                                    if (detailError) {
                                        reject(detailError);
                                    } else {
                                        resolve();
                                    }
                                },
                            );
                        });
                    });

                    Promise.all(updateDetailPromises)
                        .then(() => {
                            db.commit((commitError) => {
                                if (commitError) {
                                    return db.rollback(() => {
                                        console.error('Error committing transaction: ', commitError);
                                        res.status(500).json({ error: commitError });
                                    });
                                }
                                res.status(200).json({ message: 'Order updated successfully' });
                            });
                        })
                        .catch((updateDetailError) => {
                            db.rollback(() => {
                                console.error('Error updating order details: ', updateDetailError);
                                res.status(500).json({ error: updateDetailError });
                            });
                        });
                },
            );
        });
    }

    // [PUT] /order/:id/delete
    softDeleteOrder(req, res) {
        const id = req.params.id;

        const query = `
            UPDATE hoadon
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE idHD = ?`;
        const values = [id];

        db.query(query, values, (error, result) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' });
                return;
            }
            // res.redirect('/order');
            res.status(200).json({ message: 'Đã xóa mềm thành công' });
        });
    }
    // [DELETE] /order/:id/deletef
    forceDeleteOrder(req, res) {
        const id = req.params.id;

        const query = `
            DELETE FROM hoadon
            WHERE idHD = ?`;
        const values = [id];

        db.query(query, values, (error, result) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' });
                return;
            }
            // res.redirect('/order/trash');
            res.status(200).json({ message: 'Đã xóa thành công' });
        });
    }
    // [GET] /order/trash
    getOrdersDeleted(req, res, next) {
        // Thực hiện truy vấn SQL để lấy ra các bản ghi đã bị xóa mềm
        const { sl, sortBy, sortOrder, page = 1, limit = 9 } = req.query;

        // Tính toán offset
        const offset = (page - 1) * limit;

        // Xây dựng truy vấn SQL với điều kiện sắp xếp và phân trang (nếu có)
        let query = 'SELECT * FROM hoadon WHERE deleted_at IS NOT NULL';
        let queryParams = [];
        if (sl) {
            query += ' AND soluong > 0';
        }
        if (sortBy && sortOrder) {
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
        } else {
            query += ' ORDER BY idHD DESC';
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
            db.query(
                'SELECT COUNT(*) AS count FROM hoadon WHERE deleted_at IS NOT NULL',
                (countError, countResults) => {
                    if (countError) {
                        console.error('Error executing MySQL query: ', countError);
                        res.status(500).json({ error: countError });
                        return;
                    }

                    const totalItems = countResults[0].count;
                    const totalPages = Math.ceil(totalItems / limit);

                    res.json({ results, totalPages });
                },
            );
        });
    }
    // [PUT] /order/:id/restore
    restoreOrder(req, res) {
        const id = req.params.id;
        const query = `
            UPDATE hoadon
            SET deleted_at = NULL
            WHERE idHD = ?`;
        const values = [id];

        db.query(query, values, (error, result) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' });
                return;
            }
            res.status(200).json({ message: 'Đã khôi phục hóa đơn thành công' });
        });
    }
}

module.exports = new OrderController();
