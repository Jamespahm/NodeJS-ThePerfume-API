const db = require('./../../config/db');
const short = require('short-uuid');
const slugify = require('slugify');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');

// Cấu hình multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/assets/img/category/'); // Thư mục lưu trữ tệp tải lên
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Đặt tên tệp tải lên
    },
});
class CategoryController {
    // [GET] /category
    getAllCategories(req, res, next) {
        // Lấy thông tin truy vấn sắp xếp từ tham số truy vấn (nếu có)
        const { sortBy, sortOrder, page = 1, limit = 9 } = req.query;

        // Tính toán offset
        const offset = (page - 1) * limit;

        // Xây dựng truy vấn SQL với điều kiện sắp xếp (nếu có)
        let query = 'SELECT * FROM loai WHERE deleted_at IS NULL';
        let queryParams = [];

        if (sortBy && sortOrder) {
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
        } else {
            query += ' ORDER BY tenL ASC';
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
            db.query('SELECT COUNT(*) AS count FROM loai WHERE deleted_at IS NULL', (countError, countResults) => {
                if (countError) {
                    console.error('Error executing MySQL query: ', countError);
                    res.status(500).json({ error: countError });
                    return;
                }

                const totalItems = countResults[0].count;
                const totalPages = Math.ceil(totalItems / limit);

                res.json({ categories: results, totalPages });
            });
        });
    }

    // [GET] /category/search
    search(req, res, next) {
        const { q } = req.query;
        db.query('select * from loai where tenL like ?', ['%' + q + '%'], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            res.json(results);
        });
    }

    //[GET] /catedory/:id
    getCategoryById(req, res, next) {
        // Lấy giá trị của slug từ request
        const id = req.params.id;
        // Thực hiện truy vấn SQL để lấy bản ghi với slug tương ứng
        db.query('SELECT * FROM loai WHERE idL = ?', [id], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            // Kiểm tra xem có bản ghi nào được tìm thấy hay không
            if (results.length === 0) {
                res.status(404).json({ error: 'Không tìm thấy bản ghi với slug này' });
                return;
            }
            // Trả về bản ghi được tìm thấy
            res.json(results[0]);
        });
    }
    // [POST] /category/create
    createCategory(req, res) {
        const getFileName = (filePath) => (filePath ? path.basename(filePath) : null);

        // Sử dụng prepared statement để tránh tấn công SQL Injection
        const query = `INSERT INTO loai (idL, tenL, mota, hinhanh) VALUES (?, ?, ?, ?)`;
        const values = [
            short.generate(),
            req.body.tenL,
            req.body.mota,
            getFileName(req.files.hinhanh ? req.files.hinhanh[0].path : null),
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
    // [PUT] /brand/:id/update
    updateCategory(req, res) {
        const id = req.params.id;

        // Tạo mảng các trường cần cập nhật và các giá trị tương ứng
        let fieldsToUpdate = [];
        let values = [];

        const addFieldToUpdate = (field, value) => {
            if (value !== undefined && value !== null) {
                fieldsToUpdate.push(`${field} = ?`);
                values.push(value);
            }
        };

        addFieldToUpdate('tenL', req.body.tenL);
        addFieldToUpdate('mota', req.body.mota);
        addFieldToUpdate('hinhanh', req.files?.hinhanh ? path.basename(req.files.hinhanh[0].path) : req.body.hinhanh);
        values.push(id);

        if (fieldsToUpdate.length > 0) {
            const query = `
                UPDATE loai 
                SET ${fieldsToUpdate.join(', ')}
                WHERE idL = ?`;

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

    // [PUT] /brand/:id/delete
    softDelete(req, res) {
        const id = req.params.id;

        const query = `
            UPDATE loai
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE idL = ?`;
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
    // [DELETE] /brand/:id/deletef
    forceDelete(req, res) {
        const id = req.params.id;

        const query = `
        DELETE FROM loai
        WHERE idL = ?`;
        const values = [id];

        db.query(query, values, (error, result) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' });
                return;
            }
            res.status(200).json({ message: 'Đã xóa thành công' });
        });
    }
    // [GET] /brand/deleted
    showDeleted(req, res, next) {
        // Thực hiện truy vấn SQL để lấy ra các bản ghi đã bị xóa mềm
        db.query('SELECT * FROM loai WHERE deleted_at IS NOT NULL', (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            res.status(200).json(results);
        });
    }
    // [PUT] /brand/:id/restore
    restore(req, res) {
        const id = req.params.id;
        const query = `
        UPDATE loai
        SET deleted_at = NULL
        WHERE idL = ?`;
        const values = [id];

        db.query(query, values, (error, result) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' });
                return;
            }
            res.status(200).json({ message: 'Đã khôi phục thương hiệu thành công' });
        });
    }
}

module.exports = new CategoryController();
