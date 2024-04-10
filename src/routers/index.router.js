const siteRouter = require('./site.router');
// const newsRouter = require('./news.router');
// const courseRouter = require('./course.router');
// const meRouter = require('./me');

function route(app) {
    // app.use('/news', newsRouter);
    // app.use('/courses', courseRouter);
    // app.use('/me', meRouter);

    app.use('/', siteRouter);
}

module.exports = route;
