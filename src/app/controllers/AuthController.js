const jwt = require('jsonwebtoken');
const db = require('./../../config/db');
const short = require('short-uuid');

class AuthController {
    // [POST] /login
    login(req, res, next) {
        const { tenDN, matkhau } = req.body;

        // Tìm kiếm người dùng trong cơ sở dữ liệu bằng số điện thoại hoặc tên đăng nhập và mật khẩu
        db.query(
            'SELECT * FROM khachhang WHERE (tenDN = ? OR sdt = ?) AND matkhau = ?',
            [tenDN, tenDN, matkhau],
            (error, results) => {
                if (error) {
                    console.error('Error executing MySQL query: ', error);
                    res.status(500).json({ error });
                    return;
                }

                if (results.length === 0) {
                    res.status(401).json({ error: 'Số điện thoại hoặc tên đăng nhập hoặc mật khẩu không chính xác' });
                    return;
                }

                const user = results[0];

                // Tạo token JWT
                const tokenUser = jwt.sign({ userId: user.idKH }, 'your-secret-key');

                // Trả về token và thông điệp đăng nhập thành công
                res.json({ tokenUser, message: 'Đăng nhập thành công' });
            },
        );
    }

    // [POST] /register
    register(req, res, next) {
        const { tenKH, tenDN, matkhau, sdt } = req.body;

        // Kiểm tra nếu tên đăng nhập đã tồn tại
        db.query('SELECT * FROM khachhang WHERE tenDN = ?', [tenDN], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }

            if (results.length > 0) {
                res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });
                return;
            }

            // Kiểm tra nếu số điện thoại đã tồn tại
            db.query('SELECT * FROM khachhang WHERE sdt = ?', [sdt], (error, phoneResults) => {
                if (error) {
                    console.error('Error executing MySQL query: ', error);
                    res.status(500).json({ error });
                    return;
                }

                if (phoneResults.length > 0) {
                    res.status(409).json({ error: 'Số điện thoại đã tồn tại' });
                    return;
                }

                // Thêm người dùng mới vào cơ sở dữ liệu
                db.query(
                    'INSERT INTO khachhang (idKH, tenKH, tenDN, matkhau, sdt) VALUES (?, ?, ?, ?, ?)',
                    [short.generate(), tenKH, tenDN, matkhau, sdt],
                    (error, results) => {
                        if (error) {
                            console.error('Error executing MySQL query: ', error);
                            res.status(500).json({ error });
                            return;
                        }

                        const userId = results.insertId;

                        // Tạo token JWT
                        const tokenUser = jwt.sign({ userId: userId }, 'your-secret-key');

                        // Trả về token và thông điệp đăng ký thành công
                        res.status(201).json({ tokenUser, message: 'Đăng ký thành công' });
                    },
                );
            });
        });
    }
}

module.exports = new AuthController();
