const jwt = require('jsonwebtoken');
const db = require('../../config/db');
// const io = require('socket.io')(server); // Đảm bảo rằng bạn đã khởi tạo socket.io với server

// Hàm để chuyển đổi UUID thành chuỗi số ngắn
const generateUniqueId = () => {
    return Date.now() + Math.floor(Math.random() * 1000); // Kết hợp timestamp và số ngẫu nhiên
};

class PaymentController {
    // [POST] /payment/checkout
    checkoutCart(req, res, next) {
        const tokenUser = req.headers.authorization && req.headers.authorization.split(' ')[1];
        if (!tokenUser) {
            return res.status(401).json({ error: 'Token không hợp lệ' });
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(tokenUser, process.env.JWT_SECRET || 'your-secret-key');
        } catch (error) {
            return res.status(401).json({ error: 'Token không hợp lệ' });
        }

        const userId = decodedToken.userId;

        db.query(
            'SELECT giohang.*, nuochoa.giaban, nuochoa.soLuong AS soLuongTonKho FROM giohang INNER JOIN nuochoa ON giohang.idNH = nuochoa.idNH WHERE giohang.idKH = ?',
            [userId],
            (error, results) => {
                if (error) {
                    console.error('Error executing MySQL query: ', error);
                    return res.status(500).json({ error: 'Đã có lỗi xảy ra' });
                }

                if (results.length === 0) {
                    return res.status(404).json({ error: 'Giỏ hàng của bạn trống' });
                }

                const totalPrice = results.reduce((total, item) => total + item.soLuong * item.giaban, 0);

                const idHD = 'HD' + generateUniqueId(); // Sử dụng generateUniqueId để tạo idHD
                const trangThai = '1';
                const ngayDat = new Date();
                const updated_at = new Date();
                const { tenNhan, sdtNhan, diaChiNhan, thanhToan } = req.body;

                db.beginTransaction((transactionError) => {
                    if (transactionError) {
                        console.error('Transaction error: ', transactionError);
                        return res.status(500).json({ error: 'Đã có lỗi xảy ra' });
                    }

                    db.query(
                        'INSERT INTO hoadon (idHD, idKH, trangthai, ngaydat, ngaygiao, tongtien, tennhan, sdtnhan, diachinhan, thanhtoan, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [
                            idHD,
                            userId,
                            trangThai,
                            ngayDat,
                            null,
                            totalPrice,
                            tenNhan,
                            sdtNhan,
                            diaChiNhan,
                            thanhToan,
                            updated_at,
                        ],
                        (insertError) => {
                            if (insertError) {
                                console.error('Error inserting into hoadon: ', insertError);
                                return db.rollback(() => {
                                    res.status(500).json({ error: 'Đã có lỗi xảy ra' });
                                });
                            }

                            const insertValues = results.map((item) => [
                                'CTHD' + generateUniqueId(), // Sử dụng generateUniqueId để tạo idCTHD
                                idHD,
                                item.idNH,
                                item.soLuong,
                                item.giaban,
                            ]);

                            db.query(
                                'INSERT INTO cthoadon (idCTHD, idHD, idNH, soLuong, giaban) VALUES ?',
                                [insertValues],
                                (insertCTHDError) => {
                                    if (insertCTHDError) {
                                        console.error('Error inserting into cthoadon: ', insertCTHDError);
                                        return db.rollback(() => {
                                            res.status(500).json({ error: 'Đã có lỗi xảy ra' });
                                        });
                                    }

                                    const updatePromises = results.map((item) => {
                                        return new Promise((resolve, reject) => {
                                            const remainingQuantity = item.soLuongTonKho - item.soLuong;
                                            if (remainingQuantity < 0) {
                                                return reject(new Error('Sản phẩm đã hết hàng'));
                                            }
                                            db.query(
                                                'UPDATE nuochoa SET soluong = ?, soluongban = soluongban + ? WHERE idNH = ?',
                                                [remainingQuantity, item.soLuong, item.idNH],
                                                (updateError) => {
                                                    if (updateError) {
                                                        return reject(updateError);
                                                    }
                                                    resolve();
                                                },
                                            );
                                        });
                                    });

                                    Promise.all(updatePromises)
                                        .then(() => {
                                            db.commit((commitError) => {
                                                if (commitError) {
                                                    console.error('Commit error: ', commitError);
                                                    return res.status(500).json({ error: 'Đã có lỗi xảy ra' });
                                                }
                                                // Xóa dữ liệu giỏ hàng sau khi thanh toán thành công
                                                db.query(
                                                    'DELETE FROM giohang WHERE idKH = ?',
                                                    [userId],
                                                    (deleteError) => {
                                                        if (deleteError) {
                                                            console.error('Error deleting cart data: ', deleteError);
                                                            return res.status(500).json({ error: 'Đã có lỗi xảy ra' });
                                                        }

                                                        // Tạo thông báo mới
                                                        const idTB = 'TB' + generateUniqueId();
                                                        const message = `Người dùng vừa tạo đơn hàng mới.`;
                                                        const type = 'Đơn mới';
                                                        const query = `INSERT INTO thongbao (idTB, idKH, noidung, loai) VALUES (?, ?, ?, ?)`;
                                                        db.query(
                                                            query,
                                                            [idTB, userId, message, type],
                                                            (notificationError) => {
                                                                if (notificationError) {
                                                                    console.error(
                                                                        'Error creating notification: ',
                                                                        notificationError,
                                                                    );
                                                                } else {
                                                                    console.log('Thông báo đã được tạo thành công');
                                                                }
                                                            },
                                                        );

                                                        res.status(200).json({ message: 'Thanh toán thành công' });
                                                    },
                                                );
                                            });
                                        })
                                        .catch((updateError) => {
                                            console.error('Error updating product quantity: ', updateError);
                                            db.rollback(() => {
                                                res.status(500).json({ error: 'Đã có lỗi xảy ra' });
                                            });
                                        });
                                },
                            );
                        },
                    );
                });
            },
        );
    }

    // [POST] /payment/checkoutSingle
    checkoutSingleProduct(req, res, next) {
        const tokenUser = req.headers.authorization && req.headers.authorization.split(' ')[1];
        if (!tokenUser) {
            return res.status(401).json({ error: 'Token không hợp lệ' });
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(tokenUser, process.env.JWT_SECRET || 'your-secret-key');
        } catch (error) {
            return res.status(401).json({ error: 'Token không hợp lệ' });
        }

        const userId = decodedToken.userId;
        const { idNH, soLuong, tenNhan, sdtNhan, diaChiNhan, thanhToan } = req.body;

        db.query('SELECT giaban, soLuong AS soLuongTonKho FROM nuochoa WHERE idNH = ?', [idNH], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                return res.status(500).json({ error: 'Đã có lỗi xảy ra' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
            }

            const product = results[0];
            const totalPrice = product.giaban * soLuong;
            const remainingQuantity = product.soLuongTonKho - soLuong;

            if (remainingQuantity < 0) {
                return res.status(400).json({ error: 'Sản phẩm đã hết hàng' });
            }

            const idHD = 'HD' + generateUniqueId(); // Sử dụng generateUniqueId để tạo idHD
            const trangThai = '1';
            const ngayDat = new Date();
            const updated_at = new Date();

            db.beginTransaction((transactionError) => {
                if (transactionError) {
                    console.error('Transaction error: ', transactionError);
                    return res.status(500).json({ error: 'Đã có lỗi xảy ra' });
                }

                db.query(
                    'INSERT INTO hoadon (idHD, idKH, trangthai, ngaydat, ngaygiao, tongtien, tennhan, sdtnhan, diachinhan, thanhtoan,updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?,  ?, ?, ?)',
                    [
                        idHD,
                        userId,
                        trangThai,
                        ngayDat,
                        null,
                        totalPrice,
                        tenNhan,
                        sdtNhan,
                        diaChiNhan,
                        thanhToan,
                        updated_at,
                    ],
                    (insertError) => {
                        if (insertError) {
                            console.error('Error inserting into hoadon: ', insertError);
                            return db.rollback(() => {
                                res.status(500).json({ error: 'Đã có lỗi xảy ra' });
                            });
                        }

                        db.query(
                            'INSERT INTO cthoadon (idCTHD, idHD, idNH, soLuong, giaban) VALUES (?, ?, ?, ?, ?)',
                            ['CTHD' + generateUniqueId(), idHD, idNH, soLuong, product.giaban], // Sử dụng generateUniqueId để tạo idCTHD
                            (insertCTHDError) => {
                                if (insertCTHDError) {
                                    console.error('Error inserting into cthoadon: ', insertCTHDError);
                                    return db.rollback(() => {
                                        res.status(500).json({ error: 'Đã có lỗi xảy ra' });
                                    });
                                }

                                db.query(
                                    'UPDATE nuochoa SET soluong = ?, soluongban = soluongban + ? WHERE idNH = ?',
                                    [remainingQuantity, soLuong, idNH],
                                    (updateError) => {
                                        if (updateError) {
                                            console.error('Error updating product quantity: ', updateError);
                                            return db.rollback(() => {
                                                res.status(500).json({ error: 'Đã có lỗi xảy ra' });
                                            });
                                        }

                                        db.commit((commitError) => {
                                            if (commitError) {
                                                console.error('Commit error: ', commitError);
                                                return res.status(500).json({ error: 'Đã có lỗi xảy ra' });
                                            }

                                            // Tạo thông báo mới
                                            const idTB = 'TB' + generateUniqueId();
                                            const message = `Người dùng vừa tạo đơn hàng mới.`;
                                            const type = 'Đơn mới';
                                            const query = `INSERT INTO thongbao (idTB, idKH, noidung, loai) VALUES (?, ?, ?, ?)`;
                                            db.query(query, [idTB, userId, message, type], (notificationError) => {
                                                if (notificationError) {
                                                    console.error('Error creating notification: ', notificationError);
                                                } else {
                                                    console.log('Thông báo đã được tạo thành công');
                                                }
                                            });

                                            res.status(200).json({ message: 'Thanh toán thành công' });
                                        });
                                    },
                                );
                            },
                        );
                    },
                );
            });
        });
    }
}

module.exports = new PaymentController();
