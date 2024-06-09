const db = require('./../../config/db');
const short = require('short-uuid');
const slugify = require('slugify');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');

// Cấu hình multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/assets/img/banner/'); // Thư mục lưu trữ tệp tải lên
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Đặt tên tệp tải lên
    },
});

class BrandController {
    // [GET] /brand
    getAllBrands(req, res, next) {
        // Lấy thông tin truy vấn sắp xếp từ tham số truy vấn (nếu có)
        const { sortBy, sortOrder, page = 1, limit = 9 } = req.query;

        // Tính toán offset
        const offset = (page - 1) * limit;

        // Xây dựng truy vấn SQL với điều kiện sắp xếp (nếu có)
        let query = 'SELECT * FROM thuonghieu WHERE deleted_at IS NULL';
        let queryParams = [];

        if (sortBy && sortOrder) {
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
        } else {
            query += ' ORDER BY tenTH ASC';
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
                'SELECT COUNT(*) AS count FROM thuonghieu WHERE deleted_at IS NULL',
                (countError, countResults) => {
                    if (countError) {
                        console.error('Error executing MySQL query: ', countError);
                        res.status(500).json({ error: countError });
                        return;
                    }

                    const totalItems = countResults[0].count;
                    const totalPages = Math.ceil(totalItems / limit);

                    res.json({ brands: results, totalPages });
                },
            );
        });
    }

    // [GET] /brand/search
    search(req, res, next) {
        const { q } = req.query;
        db.query(
            'select * from thuonghieu where tenTH like ? or xuatxu like ?',
            ['%' + q + '%', '%' + q + '%'],
            (error, results) => {
                if (error) {
                    console.error('Error executing MySQL query: ', error);
                    res.status(500).json({ error });
                    return;
                }
                res.json(results);
            },
        );
    }

    // [POST] /brand/create
    createBrand(req, res) {
        const getFileName = (filePath) => (filePath ? path.basename(filePath) : null);

        // Sử dụng prepared statement để tránh tấn công SQL Injection
        const query = `INSERT INTO thuonghieu (idTH, tenTH, xuatxu, mota, hinhanh) VALUES (?, ?, ?, ?, ?)`;
        const values = [
            short.generate(),
            req.body.tenTH,
            req.body.xuatxu,
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
    updateBrand(req, res) {
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

        addFieldToUpdate('tenTH', req.body.tenTH);
        addFieldToUpdate('xuatxu', req.body.xuatxu);
        addFieldToUpdate('mota', req.body.mota);
        addFieldToUpdate('hinhanh', req.files?.hinhanh ? path.basename(req.files.hinhanh[0].path) : req.body.hinhanh);
        values.push(id);

        if (fieldsToUpdate.length > 0) {
            const query = `
                UPDATE thuonghieu 
                SET ${fieldsToUpdate.join(', ')}
                WHERE idTH = ?`;

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

    //[GET] /brand/get-once/:id
    getBrandById(req, res, next) {
        // Lấy giá trị của slug từ request
        const id = req.params.id;
        // Thực hiện truy vấn SQL để lấy bản ghi với id tương ứng
        db.query('SELECT * FROM thuonghieu WHERE idTH = ?', [id], (error, results) => {
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
    // [PUT] /brand/:id/delete
    softDelete(req, res) {
        const id = req.params.id;

        const query = `
            UPDATE thuonghieu
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE idTH = ?`;
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
        DELETE FROM thuonghieu
        WHERE idTH = ?`;
        const values = [id];

        db.query(query, values, (error, result) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' });
                return;
            }
            // res.redirect('/brand/trash');
            res.status(200).json({ message: 'Đã xóa thành công' });
        });
    }
    // [GET] /brand/deleted
    showDeleted(req, res, next) {
        // Thực hiện truy vấn SQL để lấy ra các bản ghi đã bị xóa mềm
        db.query('SELECT * FROM thuonghieu WHERE deleted_at IS NOT NULL', (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            // res.render('trash', { brand: results });
            res.status(200).json(results);
        });
    }
    // [PUT] /brand/:id/restore
    restore(req, res) {
        const id = req.params.id;
        const query = `
        UPDATE thuonghieu
        SET deleted_at = NULL
        WHERE idTH = ?`;
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

module.exports = new BrandController();
