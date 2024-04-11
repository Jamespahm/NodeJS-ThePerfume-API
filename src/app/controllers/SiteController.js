class SiteController {
    // [GET] /home
    index(req, res, next) {
        res.send('Welcom to my API ^^');
    }
}

module.exports = new SiteController();
