const db = require('./../../config/db');
// const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class SiteController {
    // [GET] /home
    index(req, res, next) {
        res.send('Welcom to my API ^^');
    }

    login(req, res, next) {
        // Lấy thông tin đăng nhập từ yêu cầu
        const { sdt, matkhau } = req.body;

        // Tìm kiếm người dùng trong cơ sở dữ liệu bằng sdt và mật khẩu
        db.query('SELECT * FROM khachhang WHERE sdt = ? AND matkhau = ?', [sdt, matkhau], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }

            if (results.length === 0) {
                res.status(401).json({ error: 'SDT hoặc mật khẩu không chính xác' });
                return;
            }

            const user = results[0];

            // Lưu thông tin người dùng vào phiên
            req.session.userId = user.idKH;
            res.json({ message: 'Đăng nhập thành công' });
        });
    }
    //[GET] /cart/items
    getCartItems(req, res, next) {
        // Lấy token từ header Authorization
        const token = req.headers.authorization.split(' ')[1];

        try {
            // Xác thực token và lấy userId từ token
            const decodedToken = jwt.verify(token, 'your-secret-key');
            const userId = decodedToken.userId;

            // Thực hiện truy vấn SQL để lấy bản ghi với userId tương ứng
            db.query('SELECT * FROM giohang WHERE idKH = ? ', [userId], (error, results) => {
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

                // Trả về bản ghi được tìm thấy
                res.json(results);
            });
        } catch (error) {
            res.status(401).json({ error: 'Token không hợp lệ' });
        }
    }

    // Endpoint API để xử lý đăng xuất
    logout(req, res) {
        // Xóa thông tin người dùng khỏi phiên
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session: ', err);
                res.status(500).json({ error: 'Lỗi đăng xuất' });
                return;
            }
            res.json({ message: 'Đăng xuất thành công' });
        });
    }
    checkAuth(req, res) {
        // Kiểm tra xem người dùng có đăng nhập hay không
        if (req.session.userId) {
            // Nếu đã đăng nhập, trả về mã status 200 và thông báo đăng nhập thành công
            res.status(200).json({ message: 'Đã đăng nhập' });
        } else {
            // Nếu chưa đăng nhập, trả về mã status 401 và thông báo lỗi đăng nhập
            res.status(401).json({ error: 'Chưa đăng nhập' });
        }
    }
}

module.exports = new SiteController();
