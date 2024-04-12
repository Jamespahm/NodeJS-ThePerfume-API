const db = require('./../../config/db');
const short = require('short-uuid');
const slugify = require('slugify');
const crypto = require('crypto');

class PerfumeController {
    // [GET] /perfume
    // [GET] /perfume
    index(req, res, next) {
        // Thực hiện truy vấn SQL để lấy ra các bản ghi chưa bị xóa mềm
        db.query('SELECT * FROM nuochoa WHERE deleted_at IS NULL', (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            res.render('store', { perfume: results });
        });
    }
    // [GET] /perfume/search
    search(req, res, next) {
        const { q } = req.query;
        db.query(
            'select * from nuochoa where TenNH like ? or GiaBan like ?',
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
    create(req, res) {
        res.render('create');
    }
    // [POST] /perfume/store
    store(req, res) {
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
            res.redirect('/perfume');
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
            // res.status(200).json({ message: 'Đã cập nhật thành công' });
            res.redirect('/perfume');
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
            res.redirect('/perfume');
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
            res.redirect('/perfume/trash');
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
            res.render('trash', { perfume: results });
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
        });
    }
}

module.exports = new PerfumeController();
