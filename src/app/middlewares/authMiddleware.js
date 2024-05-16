// // Import các thư viện cần thiết
// const express = require('express');
// const router = express.Router();

// // Định nghĩa endpoint để kiểm tra trạng thái đăng nhập
// router.get('/checkAuth', (req, res) => {
//     // Kiểm tra xem người dùng có đăng nhập hay không
//     if (req.session.userId) {
//         // Nếu đã đăng nhập, trả về mã status 200 và thông báo đăng nhập thành công
//         res.status(200).json({ message: 'Đã đăng nhập' });
//     } else {
//         // Nếu chưa đăng nhập, trả về mã status 401 và thông báo lỗi đăng nhập
//         res.status(401).json({ error: 'Chưa đăng nhập' });
//     }
// });

// // Export router
// module.exports = router;
