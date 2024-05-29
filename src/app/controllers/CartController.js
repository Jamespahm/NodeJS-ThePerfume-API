const db = require('./../../config/db');
const jwt = require('jsonwebtoken');
const short = require('short-uuid');

class CartController {
    //[GET] /cart/items
    getCartItems(req, res, next) {
        // Lấy token từ header Authorization
        const tokenUser = req.headers.authorization.split(' ')[1];
        try {
            // Xác thực token và lấy userId từ token
            const decodedToken = jwt.verify(tokenUser, 'your-secret-key');
            const userId = decodedToken.userId;
            // Thực hiện truy vấn SQL để lấy thông tin từ bảng giohang và nuochoa
            db.query(
                'SELECT giohang.*, nuochoa.* FROM giohang INNER JOIN nuochoa ON giohang.idNH = nuochoa.idNH WHERE giohang.idKH = ? ORDER BY createdAt DESC',
                [userId],
                (error, results) => {
                    if (error) {
                        console.error('Error executing MySQL query: ', error);
                        res.status(500).json({ error });
                        return;
                    }

                    // Trả về thông tin các item trong giỏ hàng kèm thông tin nước hoa tương ứng
                    res.json(results);
                },
            );
        } catch (error) {
            res.status(401).json({ error: 'Token không hợp lệ' });
        }
    }
    //[POST] /cart/add
    addCartItem(req, res, next) {
        // Lấy token từ header Authorization
        const tokenUser = req.headers.authorization.split(' ')[1];

        // Lấy id sản phẩm từ body request
        const productId = req.body.productId;
        const quantity = req.body.quantity || 1; // Số lượng mặc định là 1 nếu không được chỉ định

        try {
            // Xác thực token và lấy userId từ token
            const decodedToken = jwt.verify(tokenUser, 'your-secret-key');
            const userId = decodedToken.userId;

            // Kiểm tra xem sản phẩm đã tồn tại trong giỏ hàng của người dùng chưa
            db.query('SELECT * FROM giohang WHERE idKH = ? AND idNH = ?', [userId, productId], (error, results) => {
                if (error) {
                    console.error('Error executing MySQL query: ', error);
                    res.status(500).json({ error });
                    return;
                }

                if (results.length > 0) {
                    // Nếu sản phẩm đã tồn tại trong giỏ hàng, cập nhật số lượng
                    db.query(
                        'UPDATE giohang SET soLuong = soLuong + ?, createdAt = CURRENT_TIMESTAMP WHERE idKH = ? AND idNH = ?',
                        [quantity, userId, productId],
                        (error, result) => {
                            if (error) {
                                console.error('Error executing MySQL query: ', error);
                                res.status(500).json({ error });
                                return;
                            }

                            res.status(200).json({ message: 'Đã cập nhật số lượng sản phẩm trong giỏ hàng' });
                        },
                    );
                } else {
                    // Nếu sản phẩm chưa tồn tại trong giỏ hàng, thêm mới vào
                    db.query(
                        'INSERT INTO giohang (idGH, idKH, idNH, soLuong, createdAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
                        [short.generate(), userId, productId, quantity],
                        (error, result) => {
                            if (error) {
                                console.error('Error executing MySQL query: ', error);
                                res.status(500).json({ error });
                                return;
                            }

                            res.status(200).json({ message: 'Đã thêm sản phẩm vào giỏ hàng' });
                        },
                    );
                }
            });
        } catch (error) {
            res.status(401).json({ error: 'Token không hợp lệ' });
        }
    }

    // [DELETE] /cart/items/:cartItemId/delete
    deleteCartItem(req, res, next) {
        // Lấy id của sản phẩm trong giỏ hàng cần xóa
        const cartItemId = req.params.cartItemId;

        // Thực hiện truy vấn SQL để xóa sản phẩm khỏi giỏ hàng
        db.query('DELETE FROM giohang WHERE idGH = ? ', [cartItemId], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }

            // Kiểm tra xem có sản phẩm nào được xóa hay không
            if (results.affectedRows === 0) {
                res.status(404).json({ error: 'Không tìm thấy sản phẩm trong giỏ hàng của người dùng hiện tại' });
                return;
            }

            // Trả về thông báo xóa thành công
            res.json({ message: 'Sản phẩm đã được xóa khỏi giỏ hàng' });
        });
    }

    // [PUT] /cart/items/:itemId/increase
    increaseCartItem(req, res, next) {
        const itemId = req.params.itemId;
        // Thực hiện truy vấn SQL để tăng số lượng sản phẩm trong giỏ hàng
        db.query(
            'UPDATE giohang SET soLuong = soLuong + 1, createdAt = CURRENT_TIMESTAMP WHERE idGH = ?',
            itemId,
            (error, results) => {
                if (error) {
                    console.error('Error executing MySQL query: ', error);
                    res.status(500).json({ error });
                    return;
                }
                // Trả về thông tin đã được cập nhật
                res.json({ message: 'Số lượng sản phẩm đã được tăng' });
            },
        );
    }

    // [PUT] /cart/items/:itemId/decrease
    decreaseCartItem(req, res, next) {
        const itemId = req.params.itemId;
        // Thực hiện truy vấn SQL để giảm số lượng sản phẩm trong giỏ hàng
        db.query('UPDATE giohang SET soLuong = soLuong - 1 WHERE idGH = ?', itemId, (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            // Trả về thông tin đã được cập nhật
            res.json({ message: 'Số lượng sản phẩm đã được giảm' });
        });
    }
}
module.exports = new CartController();
