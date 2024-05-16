const db = require('./../../config/db');
const jwt = require('jsonwebtoken');
const short = require('short-uuid');

class FavouriteController {
    //[GET] /favourite/items
    getItems(req, res, next) {
        // Lấy token từ header Authorization
        const tokenUser = req.headers.authorization.split(' ')[1];
        try {
            // Xác thực token và lấy userId từ token
            const decodedToken = jwt.verify(tokenUser, 'your-secret-key');
            const userId = decodedToken.userId;
            // Thực hiện truy vấn SQL để lấy thông tin từ bảng dsyeuthich và nuochoa
            db.query(
                'SELECT dsyeuthich.*, nuochoa.* FROM dsyeuthich INNER JOIN nuochoa ON dsyeuthich.idNH = nuochoa.idNH WHERE dsyeuthich.idKH = ? ORDER BY createdAt DESC',
                [userId],
                (error, results) => {
                    if (error) {
                        console.error('Error executing MySQL query: ', error);
                        res.status(500).json({ error });
                        return;
                    }
                    // Kiểm tra xem có bản ghi nào được tìm thấy hay không
                    if (results.length === 0) {
                        res.status(404).json({ error: 'Không tìm thấy bản ghi với idKH này' });
                        return;
                    }
                    // Trả về thông tin các item trong DS yêu thích kèm thông tin nước hoa tương ứng
                    res.json(results);
                },
            );
        } catch (error) {
            res.status(401).json({ error: 'Token không hợp lệ' });
        }
    }

    //[POST] /favourite/add
    addItem(req, res, next) {
        // Lấy token từ header Authorization
        const tokenUser = req.headers.authorization.split(' ')[1];

        // Lấy id sản phẩm từ body request
        const productId = req.body.productId;
        const quantity = req.body.quantity || 1; // Số lượng mặc định là 1 nếu không được chỉ định

        try {
            // Xác thực token và lấy userId từ token
            const decodedToken = jwt.verify(tokenUser, 'your-secret-key');
            const userId = decodedToken.userId;

            // Kiểm tra xem sản phẩm đã tồn tại trong DS yêu thích của người dùng chưa
            db.query('SELECT * FROM dsyeuthich WHERE idKH = ? AND idNH = ?', [userId, productId], (error, results) => {
                if (error) {
                    console.error('Error executing MySQL query: ', error);
                    res.status(500).json({ error });
                    return;
                }

                if (results.length > 0) {
                    // Nếu sản phẩm đã tồn tại trong DS yêu thích, cập nhật số lượng
                    db.query(
                        'UPDATE dsyeuthich SET createdAt = CURRENT_TIMESTAMP WHERE idKH = ? AND idNH = ?',
                        [userId, productId],
                        (error, result) => {
                            if (error) {
                                console.error('Error executing MySQL query: ', error);
                                res.status(500).json({ error });
                                return;
                            }

                            res.status(200).json({ message: 'Đã cập nhật số lượng sản phẩm trong DS yêu thích' });
                        },
                    );
                } else {
                    // Nếu sản phẩm chưa tồn tại trong DS yêu thích, thêm mới vào
                    db.query(
                        'INSERT INTO dsyeuthich (idDSYT, idKH, idNH, createdAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
                        [short.generate(), userId, productId],
                        (error, result) => {
                            if (error) {
                                console.error('Error executing MySQL query: ', error);
                                res.status(500).json({ error });
                                return;
                            }

                            res.status(200).json({ message: 'Đã thêm sản phẩm vào DS yêu thích' });
                        },
                    );
                }
            });
        } catch (error) {
            res.status(401).json({ error: 'Token không hợp lệ' });
        }
    }

    // [DELETE] /favourite/items/:favItemId/delete
    deleteItem(req, res, next) {
        // Lấy id của sản phẩm trong DS yêu thích cần xóa
        const favItemId = req.params.favItemId;

        // Thực hiện truy vấn SQL để xóa sản phẩm khỏi DS yêu thích
        db.query('DELETE FROM dsyeuthich WHERE idDSYT = ? ', [favItemId], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }

            // Kiểm tra xem có sản phẩm nào được xóa hay không
            if (results.affectedRows === 0) {
                res.status(404).json({ error: 'Không tìm thấy sản phẩm trong DS yêu thích của người dùng hiện tại' });
                return;
            }

            // Trả về thông báo xóa thành công
            res.json({ message: 'Sản phẩm đã được xóa khỏi DS yêu thích' });
        });
    }
}
module.exports = new FavouriteController();
