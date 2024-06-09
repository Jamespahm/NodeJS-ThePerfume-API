const db = require('../../config/db');
const short = require('short-uuid');

class NotificationController {
    // [GET] /notification/
    getAllNotifications(req, res, next) {
        db.query('SELECT * FROM thongbao', (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                return res.status(500).json({ error: 'Đã có lỗi xảy ra' });
            }

            res.status(200).json(results);
        });
    }
    // [GET] /notification/unread
    getUnreadNotifications(req, res, next) {
        db.query('SELECT * FROM thongbao WHERE trangthai IS NULL', (error, results) => {
            if (error) {
                console.error('Error executing MySQL query: ', error);
                return res.status(500).json({ error: 'Đã có lỗi xảy ra' });
            }
            res.status(200).json(results);
        });
    }

    // [PUT] /notification/:id/read
    markAsRead(req, res, next) {
        const notificationId = req.params.id;

        const query = 'UPDATE thongbao SET trangthai = ? WHERE idTB = ?';
        db.query(query, ['read', notificationId], (error, results) => {
            if (error) {
                console.error('Error marking notification as read: ', error);
                return res.status(500).json({ error: 'Đã có lỗi xảy ra' });
            }

            res.status(200).json({ message: 'Thông báo đã được đánh dấu là đã đọc' });
        });
    }

    // [DELETE] /notification/:id/delete
    deleteNotification(req, res, next) {
        const notificationId = req.params.id;

        const query = 'DELETE FROM thongbao WHERE idTB = ?';
        db.query(query, [notificationId], (error, results) => {
            if (error) {
                console.error('Error deleting notification: ', error);
                return res.status(500).json({ error: 'Đã có lỗi xảy ra' });
            }

            res.status(200).json({ message: 'Thông báo đã được xóa' });
        });
    }
}

module.exports = new NotificationController();
