const siteRouter = require('./site.router');
const perfumeRouter = require('./perfume.router');
const categoryRouter = require('./category.router');
const brandRouter = require('./brand.router');
const cartRouter = require('./cart.router');
const authRouter = require('./auth.router');
const paymentRouter = require('./payment.router');
const favouriteRouter = require('./favourite.router');
const orderRouter = require('./order.router');
const statisticRouter = require('./statistic.router');
const userRouter = require('./user.router');
const notificationRouter = require('./notification.router');

function route(app) {
    app.use('/api/perfume', perfumeRouter);
    app.use('/api/category', categoryRouter);
    app.use('/api/brand', brandRouter);
    app.use('/api/cart', cartRouter);
    app.use('/api/auth', authRouter);
    app.use('/api/payment', paymentRouter);
    app.use('/api/favourite', favouriteRouter);
    app.use('/api/order', orderRouter);
    app.use('/api/statistic', statisticRouter);
    app.use('/api/user', userRouter);
    app.use('/api/notification', notificationRouter);

    app.use('/api/', siteRouter);
}

module.exports = route;
