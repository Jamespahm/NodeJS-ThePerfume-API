const db = require('./../../config/db');
const short = require('short-uuid');
const slugify = require('slugify');
const crypto = require('crypto');

class BrandController {
    // [GET] /perfume
    index(req, res, next) {
        // Lấy thông tin truy vấn sắp xếp từ tham số truy vấn (nếu có)
        const { sortBy, sortOrder } = req.query;

        // Xây dựng truy vấn SQL với điều kiện sắp xếp (nếu có)
        let query = 'SELECT * FROM thuonghieu WHERE deleted_at IS NULL ORDER BY tenTH DESC';
        if (sortBy && sortOrder) {
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
        }

        db.query(query, (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            res.json(results);
        });
    }

    // [GET] /perfume/search
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
    creat(req, res) {
        res.render('create');
    }
    // [POST] /category/create
    create(req, res) {
        // Sử dụng prepared statement để tránh tấn công SQL Injection
        const query = `INSERT INTO thuonghieu (idTH, tenTH, xuatxu, hinhanh) VALUES (?, ?, ?, ?)`;
        const values = [short.generate(), req.body.tenTH, req.body.xuatxu, req.body.hinhanh];

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

    //[GET] /catedory/:id
    show(req, res, next) {
        // Lấy giá trị của slug từ request
        const id = req.params.id;
        // Thực hiện truy vấn SQL để lấy bản ghi với slug tương ứng
        db.query('SELECT * FROM thuonghieu WHERE idTH = ? IS ', [id], (error, results) => {
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
    // [GET] /catedory/edit/:id
    edit(req, res) {
        const id = req.params.id;
        db.query('SELECT * FROM thuonghieu WHERE idTH = ?', [id], (error, results) => {
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
            res.render('edit', { category: results[0] });
        });
    }
    // [PUT] /catedory/update/:id
    update(req, res) {
        const id = req.params.id;
        const { tenTH, xuatxu, hinhanh } = req.body;

        // Cập nhật thông tin bản ghi trong cơ sở dữ liệu
        const query = `
            UPDATE thuonghieu
            SET tenTH = ?, xuatxu = ?, hinhanh = ?
            WHERE idTH = ?`;
        const values = [tenTH, xuatxu, hinhanh, id];

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

    // [PUT] /catedory/delete/:id
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
            // res.redirect('/perfume');
            res.status(200).json({ message: 'Đã xóa mềm thành công' });
        });
    }

    // [DELETE] /catedory/force-delete/:id
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
            // res.redirect('/perfume/trash');
            res.status(200).json({ message: 'Đã xóa thành công' });
        });
    }
    // [GET] /catedory/deleted
    showDeleted(req, res, next) {
        // Thực hiện truy vấn SQL để lấy ra các bản ghi đã bị xóa mềm
        db.query('SELECT * FROM thuonghieu WHERE deleted_at IS NOT NULL', (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                res.status(500).json({ error });
                return;
            }
            // res.render('trash', { perfume: results });
            res.status(200).json(results);
        });
    }
    // [PUT] /catedory/restore/:id
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
            res.status(200).json({ message: 'Đã khôi phục sản phẩm thành công' });
            // res.redirect('/perfume/trash');
        });
    }
}

module.exports = new BrandController();
