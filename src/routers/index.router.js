const siteRouter = require('./site.router');
const perfumeRouter = require('./perfume.router');
// const courseRouter = require('./course.router');
// const meRouter = require('./me');

function route(app) {
    app.use('/perfume', perfumeRouter);
    // app.use('/courses', courseRouter);
    // app.use('/me', meRouter);

    app.use('/', siteRouter);
}

module.exports = route;
