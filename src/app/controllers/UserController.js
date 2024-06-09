const db = require('./../../config/db');
const short = require('short-uuid');
const slugify = require('slugify');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Cấu hình multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/assets/img/user-avt/'); // Thư mục lưu trữ tệp tải lên
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Đặt tên tệp tải lên
    },
});
class UserController {
    // [GET] /user
    index(req, res, next) {
        // Lấy thông tin truy vấn sắp xếp từ tham số truy vấn (nếu có)
        const { sortBy, sortOrder, page = 1, limit = 9 } = req.query;

        // Tính toán offset
        const offset = (page - 1) * limit;

        // Xây dựng truy vấn SQL với điều kiện sắp xếp (nếu có)
        let query = 'SELECT * FROM khachhang WHERE deleted_at IS NULL';
        let queryParams = [];

        if (sortBy && sortOrder) {
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
        } else {
            query += ' ORDER BY tenKH DESC';
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
            db.query('SELECT COUNT(*) AS count FROM khachhang WHERE deleted_at IS NULL', (countError, countResults) => {
                if (countError) {
                    console.error('Error executing MySQL query: ', countError);
                    res.status(500).json({ error: countError });
                    return;
                }

                const totalItems = countResults[0].count;
                const totalPages = Math.ceil(totalItems / limit);

                res.json({ users: results, totalPages });
            });
        });
    }

    // [GET] /user/search
    search(req, res, next) {
        const { sortBy, sortOrder, page, limit, q } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM khachhang WHERE deleted_at IS NULL';
        let queryParams = [];

        if (q) {
            query += ' AND tenKH LIKE ? or gioitinh LIKE ? or email LIKE ? or sdt LIKE ?';
            queryParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
        }

        if (sortBy && sortOrder) {
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
        } else {
            query += ' ORDER BY tenKH ASC';
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
            let countQuery = 'SELECT COUNT(*) AS count FROM khachhang WHERE deleted_at IS NULL ';

            if (q) {
                countQuery += ' AND tenKH LIKE ? or gioitinh LIKE ? or email LIKE ? or sdt LIKE ?';
            }

            db.query(countQuery, queryParams.slice(0, -2), (countError, countResults) => {
                if (countError) {
                    console.error('Error executing MySQL query: ', countError);
                    res.status(500).json({ error: countError });
                    return;
                }

                const totalItems = countResults[0].count;
                const totalPages = Math.ceil(totalItems / limit);

                res.json({ users: results, totalPages });
            });
        });
    }

    // [POST] /user/create
    createUser(req, res) {
        const getFileName = (filePath) => (filePath ? path.basename(filePath) : null);

        // Sử dụng prepared statement để tránh tấn công SQL Injection
        const query = `INSERT INTO khachhang (idKH, tenKH,gioitinh, tenDN,sdt,email,diachi,matkhau, avatar) VALUES (?, ?,?, ?, ?, ?, ?,?, ?)`;
        const values = [
            short.generate(),
            req.body.tenKH,
            req.body.gioitinh,
            req.body.tenDN,
            req.body.sdt,
            req.body.email,
            req.body.diachi,
            req.body.matkhau,
            getFileName(req.files.avatar ? req.files.avatar[0].path : null),
        ];

        db.query(query, values, function (err, result) {
            if (err) {
                console.error('Error executing MySQL query: ', err);
                res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' });
                return;
            }
            res.status(200).json({ message: 'Đã thêm thành công' });
        });
    }
    // [PUT] /user/:id/update
    updateUser(req, res) {
        const userId = req.params.id;

        // Tạo mảng các trường cần cập nhật và các giá trị tương ứng
        let fieldsToUpdate = [];
        let values = [];

        const addFieldToUpdate = (field, value) => {
            if (value !== undefined && value !== null) {
                fieldsToUpdate.push(`${field} = ?`);
                values.push(value);
            }
        };

        addFieldToUpdate('tenKH', req.body.tenKH);
        addFieldToUpdate('gioitinh', req.body.gioitinh);
        addFieldToUpdate('sdt', req.body.sdt);
        addFieldToUpdate('email', req.body.email);
        addFieldToUpdate('diachi', req.body.diachi);
        addFieldToUpdate('matkhau', req.body.matkhau);

        addFieldToUpdate('avatar', req.files?.avatar ? path.basename(req.files.avatar[0].path) : req.body.avatar);
        values.push(userId);

        if (fieldsToUpdate.length > 0) {
            const query = `
                UPDATE khachhang 
                SET ${fieldsToUpdate.join(', ')}
                WHERE idKH = ?`;

            db.query(query, values, function (err, result) {
                if (err) {
                    console.error('Error executing MySQL query: ', err);
                    res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' });
                    return;
                }
                res.status(200).json({ message: 'Đã cập nhật thành công' });
            });
        } else {
            res.status(400).json({ error: 'Không có trường nào để cập nhật' });
        }
    }
    // [GET] /user/profile
    getProfile(req, res, next) {
        try {
            // Kiểm tra Authorization header
            if (!req.headers.authorization) {
                return res.status(400).json({ error: 'Authorization header is missing' });
            }
            const tokenUser = req.headers.authorization.split(' ')[1];
            if (!tokenUser) {
                return res.status(400).json({ error: 'Token is missing from Authorization header' });
            }

            // Xác thực token và lấy userId từ token
            const decodedToken = jwt.verify(tokenUser, 'your-secret-key');
            const userId = decodedToken.userId;

            // Thực hiện truy vấn SQL để lấy bản ghi với idKH tương ứng
            db.query('SELECT * FROM khachhang WHERE idKH = ? AND deleted_at IS NULL', [userId], (error, results) => {
                if (error) {
                    console.error('Error executing MySQL query: ', error);
                    return res.status(500).json({ error: 'Database query error' });
                }

                // Kiểm tra xem có bản ghi nào được tìm thấy hay không
                if (results.length === 0) {
                    return res.status(404).json({ error: 'Không tìm thấy bản ghi với idKH này' });
                }

                // Trả về bản ghi được tìm thấy
                res.json(results[0]);
            });
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Token không hợp lệ' });
            }
            console.error('Unexpected error: ', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // [PUT] /user/profile
    updateProfile(req, res) {
        try {
            // Kiểm tra Authorization header
            if (!req.headers.authorization) {
                return res.status(400).json({ error: 'Authorization header is missing' });
            }
            const tokenUser = req.headers.authorization.split(' ')[1];
            if (!tokenUser) {
                return res.status(400).json({ error: 'Token is missing from Authorization header' });
            }

            const decodedToken = jwt.verify(tokenUser, 'your-secret-key');
            const userId = decodedToken.userId;

            // Tạo mảng các trường cần cập nhật và các giá trị tương ứng
            let fieldsToUpdate = [];
            let values = [];

            const addFieldToUpdate = (field, value) => {
                if (value !== undefined && value !== null) {
                    fieldsToUpdate.push(`${field} = ?`);
                    values.push(value);
                }
            };

            addFieldToUpdate('tenKH', req.body.tenKH);
            addFieldToUpdate('gioitinh', req.body.gioitinh);
            addFieldToUpdate('sdt', req.body.sdt);
            addFieldToUpdate('email', req.body.email);
            addFieldToUpdate('diachi', req.body.diachi);
            addFieldToUpdate('matkhau', req.body.matkhau);

            addFieldToUpdate('avatar', req.files?.avatar ? path.basename(req.files.avatar[0].path) : req.body.avatar);
            values.push(userId);

            if (fieldsToUpdate.length > 0) {
                const query = `
                UPDATE khachhang 
                SET ${fieldsToUpdate.join(', ')}
                WHERE idKH = ?`;

                db.query(query, values, function (err, result) {
                    if (err) {
                        console.error('Error executing MySQL query: ', err);
                        res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' });
                        return;
                    }
                    res.status(200).json({ message: 'Đã cập nhật thành công' });
                });
            } else {
                res.status(400).json({ error: 'Không có trường nào để cập nhật' });
            }
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Token không hợp lệ' });
            }
            console.error('Unexpected error: ', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    //[GET] /user/get-once/:id
    getUserById(req, res, next) {
        // Lấy giá trị của slug từ request
        const id = req.params.id;
        // Thực hiện truy vấn SQL để lấy bản ghi với id tương ứng
        db.query('SELECT * FROM khachhang WHERE idKH = ?', [id], (error, results) => {
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

    // [PUT] /user/delete/:id
    softDelete(req, res) {
        const id = req.params.id;

        const query = `
            UPDATE khachhang
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE idKH = ?`;
        const values = [id];

        db.query(query, values, (error, result) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' });
                return;
            }
            res.status(200).json({ message: 'Đã xóa mềm thành công' });
        });
    }
    // [DELETE] /user/deletef/:id
    forceDelete(req, res) {
        const id = req.params.id;

        const query = `
        DELETE FROM khachhang
        WHERE idKH = ?`;
        const values = [id];

        db.query(query, values, (error, result) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' });
                return;
            }
            // res.redirect('/user/trash');
            res.status(200).json({ message: 'Đã xóa thành công' });
        });
    }
    // [GET] /user/deleted
    showDeleted(req, res, next) {
        // Thực hiện truy vấn SQL để lấy ra các bản ghi đã bị xóa mềm
        db.query('SELECT * FROM khachhang WHERE deleted_at IS NOT NULL', (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            // res.render('trash', { user: results });
            res.status(200).json(results);
        });
    }
    // [PUT] /user/restore/:id
    restore(req, res) {
        const id = req.params.id;
        const query = `
        UPDATE khachhang
        SET deleted_at = NULL
        WHERE idKH = ?`;
        const values = [id];

        db.query(query, values, (error, result) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' });
                return;
            }
            res.status(200).json({ message: 'Đã khôi phục sản phẩm thành công' });
        });
    }
}

module.exports = new UserController();
