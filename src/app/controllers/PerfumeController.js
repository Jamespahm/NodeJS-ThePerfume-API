const db = require('./../../config/db');
const short = require('short-uuid');
const slugify = require('slugify');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');

// Cấu hình multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/assets/img/products/'); // Thư mục lưu trữ tệp tải lên
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Đặt tên tệp tải lên
    },
});

const upload = multer({ storage: storage });
class PerfumeController {
    // [GET] /perfume/
    getAllPerfumes(req, res, next) {
        const { sl, sortBy, sortOrder, minPrice, maxPrice, categoryId, brandId, page = 1, limit = 9 } = req.query;

        // Tính toán offset
        const offset = (page - 1) * limit;

        // Xây dựng truy vấn SQL với điều kiện sắp xếp và phân trang (nếu có)
        let query = 'SELECT * FROM nuochoa WHERE deleted_at IS NULL';
        let queryParams = [];
        if (sl) {
            query += ' AND soluong > 0';
        }
        if (minPrice && maxPrice) {
            query += ' AND giaban BETWEEN ? AND ?';
            queryParams.push(minPrice, maxPrice);
        }
        if (categoryId) {
            query += ' AND idL = ?';
            queryParams.push(categoryId);
        }
        if (brandId) {
            query += ' AND idTH = ?';
            queryParams.push(brandId);
        }
        if (sortBy && sortOrder) {
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
        } else {
            query += ' ORDER BY soluongban DESC';
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
            db.query('SELECT COUNT(*) AS count FROM nuochoa WHERE deleted_at IS NULL', (countError, countResults) => {
                if (countError) {
                    console.error('Error executing MySQL query: ', countError);
                    res.status(500).json({ error: countError });
                    return;
                }

                const totalItems = countResults[0].count;
                const totalPages = Math.ceil(totalItems / limit);

                res.json({ products: results, totalPages });
            });
        });
    }
    // [GET] /perfume/search
    searchPerfumes(req, res, next) {
        const { sl, sortBy, sortOrder, page, limit, q } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM nuochoa WHERE deleted_at IS NULL';
        let queryParams = [];
        if (sl) {
            query += ' AND soluong > 0';
        }
        if (q) {
            query += ' AND tenNH LIKE ? or giaban LIKE ? or soluong LIKE ?';
            queryParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }

        if (sortBy && sortOrder) {
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
        } else {
            query += ' ORDER BY tenNH ASC';
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
            let countQuery = 'SELECT COUNT(*) AS count FROM nuochoa WHERE deleted_at IS NULL AND soluong > 0';

            if (q) {
                countQuery += ' AND tenNH LIKE ? or giaban LIKE ? or soluong LIKE ?';
            }

            db.query(countQuery, queryParams.slice(0, -2), (countError, countResults) => {
                if (countError) {
                    console.error('Error executing MySQL query: ', countError);
                    res.status(500).json({ error: countError });
                    return;
                }

                const totalItems = countResults[0].count;
                const totalPages = Math.ceil(totalItems / limit);

                res.json({ products: results, totalPages });
            });
        });
    }
    // [GET] /perfume/sales
    hotSales(req, res, next) {
        const query = `
        SELECT nh.*, SUM(cthd.soLuong) AS soLuongBan
        FROM cthoadon AS cthd
        JOIN nuochoa AS nh ON cthd.idNH = nh.idNH
        WHERE nh.soluong > 0 AND nh.deleted_at IS NULL
        GROUP BY nh.idNH
        ORDER BY soLuongBan DESC
        LIMIT 8;
            `;

        db.query(query, (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            res.json(results);
        });
    }
    // [GET] /perfume/newest
    getNewestPerfumes(req, res, next) {
        const query = `
            SELECT * FROM nuochoa 
            WHERE deleted_at IS NULL 
            ORDER BY created_at DESC 
            LIMIT 8;
        `;

        db.query(query, (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            res.json(results);
        });
    }
    // [POST] /perfume/add
    addPerfume(req, res) {
        // Tạo slug từ tiêu đề
        let slug = slugify(req.body.tenNH, {
            lower: true, // Chuyển đổi sang chữ thường
            strict: true, // Loại bỏ các ký tự đặc biệt
        });

        // Tạo chuỗi ngẫu nhiên ngắn hơn
        const randomString = crypto.randomBytes(4).toString('hex'); // Tạo chuỗi ngẫu nhiên 8 ký tự hex

        // Thêm chuỗi ngẫu nhiên vào cuối slug để tạo slug duy nhất
        slug += '-' + randomString;

        // Sử dụng prepared statement để tránh tấn công SQL Injection
        const query = `INSERT INTO nuochoa (idNH, tenNH, giaban, dungtich, hinhanh1, hinhanh2, hinhanh3, hinhanh4, soluong, mota, motact, slug, idTH, idL,created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, CURRENT_TIMESTAMP)`;

        const getFileName = (filePath) => (filePath ? path.basename(filePath) : null);

        const values = [
            short.generate(),
            req.body.tenNH,
            req.body.giaban,
            req.body.dungtich,
            getFileName(req.files.hinhanh1 ? req.files.hinhanh1[0].path : null),
            getFileName(req.files.hinhanh2 ? req.files.hinhanh2[0].path : null),
            getFileName(req.files.hinhanh3 ? req.files.hinhanh3[0].path : null),
            getFileName(req.files.hinhanh4 ? req.files.hinhanh4[0].path : null),
            req.body.soluong,
            req.body.mota,
            req.body.motact,
            slug,
            req.body.idTH,
            req.body.idL,
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

    // [PUT] /perfume/:id/update
    updatePerfume(req, res) {
        const perfumeId = req.params.id;
        // Tạo slug từ tiêu đề
        let slug = slugify(req.body.tenNH, {
            lower: true, // Chuyển đổi sang chữ thường
            strict: true, // Loại bỏ các ký tự đặc biệt
        });

        // Tạo chuỗi ngẫu nhiên ngắn hơn
        const randomString = crypto.randomBytes(4).toString('hex'); // Tạo chuỗi ngẫu nhiên 8 ký tự hex

        // Thêm chuỗi ngẫu nhiên vào cuối slug để tạo slug duy nhất
        slug += '-' + randomString;
        // Tạo mảng các trường cần cập nhật và các giá trị tương ứng
        let fieldsToUpdate = [];
        let values = [];

        const addFieldToUpdate = (field, value) => {
            if (value !== undefined && value !== null) {
                fieldsToUpdate.push(`${field} = ?`);
                values.push(value);
            }
        };

        addFieldToUpdate('tenNH', req.body.tenNH);
        addFieldToUpdate('giaban', req.body.giaban);
        addFieldToUpdate('dungtich', req.body.dungtich);
        addFieldToUpdate(
            'hinhanh1',
            req.files?.hinhanh1 ? path.basename(req.files.hinhanh1[0].path) : req.body.hinhanh1,
        );
        addFieldToUpdate(
            'hinhanh2',
            req.files?.hinhanh2 ? path.basename(req.files.hinhanh2[0].path) : req.body.hinhanh2,
        );
        addFieldToUpdate(
            'hinhanh3',
            req.files?.hinhanh3 ? path.basename(req.files.hinhanh3[0].path) : req.body.hinhanh3,
        );
        addFieldToUpdate(
            'hinhanh4',
            req.files?.hinhanh4 ? path.basename(req.files.hinhanh4[0].path) : req.body.hinhanh4,
        );
        addFieldToUpdate('soluong', req.body.soluong);
        addFieldToUpdate('soluongban', req.body.soluongban);
        addFieldToUpdate('mota', req.body.mota);
        addFieldToUpdate('motact', req.body.motact);
        addFieldToUpdate('idTH', req.body.idTH);
        addFieldToUpdate('idL', req.body.idL);
        addFieldToUpdate('slug', slug);

        values.push(perfumeId);

        if (fieldsToUpdate.length > 0) {
            const query = `
                UPDATE nuochoa 
                SET ${fieldsToUpdate.join(', ')}
                WHERE idNH = ?`;

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

    //[GET] /perfume/:slug
    getPerfumeBySlug(req, res, next) {
        // Lấy giá trị của slug từ request
        const slug = req.params.slug;
        // Thực hiện truy vấn SQL để lấy bản ghi với slug tương ứng
        db.query('SELECT * FROM nuochoa WHERE slug = ?', [slug], (error, results) => {
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
    // [GET] /perfume/related/:id
    getRelatedPerfumes(req, res) {
        const slug = req.params.slug;

        // Get the current perfume's details to find related ones
        db.query('SELECT * FROM nuochoa WHERE slug = ?', [slug], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }

            if (results.length === 0) {
                res.status(404).json({ error: 'Perfume not found' });
                return;
            }

            const currentPerfume = results[0];

            // Query for related perfumes in the same category or brand, excluding the current one
            db.query(
                'SELECT * FROM nuochoa WHERE (idL = ? OR idTH = ?) AND slug != ? AND deleted_at IS NULL LIMIT 6',
                [currentPerfume.idL, currentPerfume.idTH, slug],
                (relatedError, relatedResults) => {
                    if (relatedError) {
                        console.error('Error executing MySQL query: ', relatedError);
                        res.status(500).json({ error: relatedError });
                        return;
                    }

                    res.json({ relatedPerfumes: relatedResults });
                },
            );
        });
    }
    //[GET] /perfume/get-once/:id
    getPerfumeById(req, res, next) {
        // Lấy giá trị của slug từ request
        const id = req.params.id;
        // Thực hiện truy vấn SQL để lấy bản ghi với id tương ứng
        db.query('SELECT * FROM nuochoa WHERE idNH = ?', [id], (error, results) => {
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

    // [PUT] /perfume/:id/delete
    softDeletePerfume(req, res) {
        const id = req.params.id;

        const query = `
        UPDATE nuochoa
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE idNH = ?`;
        const values = [id];

        db.query(query, values, (error, result) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' });
                return;
            }
            // res.redirect('/perfume');
            res.status(200).json({ message: 'Đã xóa mềm thành công' });
        });
    }
    // [DELETE] /perfume/:id/deletef
    forceDeletePerfume(req, res) {
        const id = req.params.id;

        const query = `
        DELETE FROM nuochoa
        WHERE idNH = ?`;
        const values = [id];

        db.query(query, values, (error, result) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' });
                return;
            }
            // res.redirect('/perfume/trash');
            res.status(200).json({ message: 'Đã xóa thành công' });
        });
    }
    // [GET] /perfume/trash
    getPerfumesDeleted(req, res, next) {
        // Thực hiện truy vấn SQL để lấy ra các bản ghi đã bị xóa mềm
        const { sl, sortBy, sortOrder, page = 1, limit = 9 } = req.query;

        // Tính toán offset
        const offset = (page - 1) * limit;

        // Xây dựng truy vấn SQL với điều kiện sắp xếp và phân trang (nếu có)
        let query = 'SELECT * FROM nuochoa WHERE deleted_at IS NOT NULL';
        let queryParams = [];
        if (sl) {
            query += ' AND soluong > 0';
        }
        if (sortBy && sortOrder) {
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
        } else {
            query += ' ORDER BY idNH DESC';
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
                'SELECT COUNT(*) AS count FROM nuochoa WHERE deleted_at IS NOT NULL',
                (countError, countResults) => {
                    if (countError) {
                        console.error('Error executing MySQL query: ', countError);
                        res.status(500).json({ error: countError });
                        return;
                    }

                    const totalItems = countResults[0].count;
                    const totalPages = Math.ceil(totalItems / limit);

                    res.json({ products: results, totalPages });
                },
            );
        });
    }
    // [PUT] /perfume/:id/restore
    restorePerfume(req, res) {
        const id = req.params.id;
        const query = `
        UPDATE nuochoa
        SET deleted_at = NULL
        WHERE idNH = ?`;
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

module.exports = new PerfumeController();
