const jwt = require('jsonwebtoken');
const db = require('./../../config/db');

class AuthController {
    // [POST] /login
    login(req, res, next) {
        const { sdt, matkhau } = req.body;

        // Tìm kiếm người dùng trong cơ sở dữ liệu bằng số điện thoại và mật khẩu
        db.query('SELECT * FROM khachhang WHERE sdt = ? AND matkhau = ?', [sdt, matkhau], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }

            if (results.length === 0) {
                res.status(401).json({ error: 'Số điện thoại hoặc mật khẩu không chính xác' });
                return;
            }

            const user = results[0];

            // Tạo token JWT
            const tokenUser = jwt.sign({ userId: user.idKH }, 'your-secret-key');

            // Trả về token và thông điệp đăng nhập thành công
            res.json({ tokenUser, message: 'Đăng nhập thành công' });
        });
    }
}
module.exports = new AuthController();
