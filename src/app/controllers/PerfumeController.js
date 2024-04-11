// const Perfume = require('../models/Perfume.model');
const db = require('./../../config/db');
const { v4: uuidv4 } = require('uuid');

class PerfumeController {
    // [GET] /perfume
    index(req, res, next) {
        // Thực hiện các truy vấn MySQL ở đây
        db.query('select * from nuochoa', (error, results) => {
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
}

module.exports = new PerfumeController();
