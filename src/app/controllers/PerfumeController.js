const db = require('./../../config/db');
const short = require('short-uuid');
const slugify = require('slugify');
const crypto = require('crypto');

class PerfumeController {
    // [GET] /perfume
    index(req, res, next) {
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
    // // [GET] /perfume/items
    // getPerfumeItems(req, res, next) {
    //     const { sortBy, sortOrder, minPrice, maxPrice, categoryId, brandId, page = 1, limit = 9 } = req.query;

    //     // Tính toán offset
    //     const offset = (page - 1) * limit;

    //     // Xây dựng truy vấn SQL với điều kiện sắp xếp và phân trang (nếu có)
    //     let query = 'SELECT * FROM nuochoa WHERE deleted_at IS NULL ';
    //     let queryParams = [];

    //     if (sortBy && sortOrder) {
    //         query += ` ORDER BY ${sortBy} ${sortOrder}`;
    //     } else {
    //         query += ' ORDER BY idNH DESC';
    //     }
    //     query += ' LIMIT ? OFFSET ?';
    //     queryParams.push(parseInt(limit), parseInt(offset));

    //     db.query(query, queryParams, (error, results) => {
    //         if (error) {
    //             console.error('Error executing MySQL query: ', error);
    //             res.status(500).json({ error });
    //             return;
    //         }

    //         // Đếm tổng số sản phẩm để tính tổng số trang
    //         db.query('SELECT COUNT(*) AS count FROM nuochoa WHERE deleted_at IS NULL', (countError, countResults) => {
    //             if (countError) {
    //                 console.error('Error executing MySQL query: ', countError);
    //                 res.status(500).json({ error: countError });
    //                 return;
    //             }

    //             const totalItems = countResults[0].count;
    //             const totalPages = Math.ceil(totalItems / limit);

    //             res.json({ products: results, totalPages });
    //         });
    //     });
    // }
    // [GET] /perfume/search
    search(req, res, next) {
        const { sl, sortBy, sortOrder, page, limit, q } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM nuochoa WHERE deleted_at IS NULL';
        let queryParams = [];
        if (sl) {
            query += ' AND soluong > 0';
        }
        if (q) {
            query += ' AND tenNH LIKE ?';
            queryParams.push(`%${q}%`);
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
                countQuery += ' AND tenNH LIKE ?';
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
    sales(req, res, next) {
        //     const query = `
        //     SELECT nh.*, SUM(cthd.soluong) AS totalSold
        //     FROM cthoadon AS cthd
        //     JOIN nuochoa AS nh ON cthd.idNH = nh.idNH
        //     GROUP BY nh.idNH
        //     ORDER BY totalSold DESC
        // `;
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
    creat(req, res) {
        res.render('create');
    }
    // [POST] /perfume/store
    create(req, res) {
        // Tạo slug từ tiêu đề
        let slug = slugify(req.body.tenNH, {
            lower: true, // Chuyển đổi sang chữ thường
            strict: true, // Loại bỏ các ký tự đặc biệt
        });

        // // Thêm một chuỗi ngẫu nhiên vào cuối slug để tạo slug duy nhất
        // slug += '-' + short.generate();
        // Tạo chuỗi ngẫu nhiên ngắn hơn
        const randomString = crypto.randomBytes(4).toString('hex'); // Tạo chuỗi ngẫu nhiên 8 ký tự hex

        // Thêm chuỗi ngẫu nhiên vào cuối slug để tạo slug duy nhất
        slug += '-' + randomString;

        // Sử dụng prepared statement để tránh tấn công SQL Injection
        const query = `INSERT INTO nuochoa (idNH, tenNH, giaban, dungtich, hinhanh1, hinhanh2, hinhanh3, hinhanh4, soluong, mota, slug, idTH, idL) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            short.generate(),
            req.body.tenNH,
            req.body.giaban,
            req.body.dungtich,
            req.body.hinhanh1,
            req.body.hinhanh2,
            req.body.hinhanh3,
            req.body.hinhanh4,
            req.body.soluong,
            req.body.mota,
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
            // res.redirect('/perfume');
            res.status(200).json({ message: 'Đã thêm thành công' });
        });
    }
    //[GET] /perfume/:slug
    show(req, res, next) {
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
    // [GET] /perfume/edit/:id
    edit(req, res) {
        const id = req.params.id;
        db.query('SELECT * FROM nuochoa WHERE idNH = ?', [id], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ error: 'Không tìm thấy bản ghi với id này' });
                return;
            }
            // Trả về trang chỉnh sửa với dữ liệu bản ghi đã được tìm thấy
            res.render('edit', { perfume: results[0] });
        });
    }
    // [PUT] /perfume/update/:id
    update(req, res) {
        const id = req.params.id;
        const { tenNH, giaban, dungtich, hinhanh1, hinhanh2, hinhanh3, hinhanh4, soluong, mota, idTH, idL } = req.body;

        // Cập nhật thông tin bản ghi trong cơ sở dữ liệu
        const query = `
            UPDATE nuochoa
            SET tenNH = ?, giaban = ?, dungtich = ?, hinhanh1 = ?, hinhanh2 = ?, hinhanh3 = ?, hinhanh4 = ?, soluong = ?, mota = ?, idTH = ?, idL = ?
            WHERE idNH = ?`;
        const values = [tenNH, giaban, dungtich, hinhanh1, hinhanh2, hinhanh3, hinhanh4, soluong, mota, idTH, idL, id];

        db.query(query, values, (error, result) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu' });
                return;
            }
            res.status(200).json({ message: 'Đã cập nhật thành công' });
            // res.redirect('/perfume');
        });
    }
    // [PUT] /perfume/delete/:id
    softDelete(req, res) {
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
    // [DELETE] /perfume/force-delete/:id
    forceDelete(req, res) {
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
    // [GET] /perfume/deleted
    showDeleted(req, res, next) {
        // Thực hiện truy vấn SQL để lấy ra các bản ghi đã bị xóa mềm
        db.query('SELECT * FROM nuochoa WHERE deleted_at IS NOT NULL', (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            // res.render('trash', { perfume: results });
            res.status(200).json(results);
        });
    }
    // [PUT] /perfume/restore/:id
    restore(req, res) {
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
            // res.redirect('/perfume/trash');
        });
    }
}

module.exports = new PerfumeController();
