
class SiteController {
    // [GET] /home
    index(req, res, next) {
       res.send('home')
    }

    // [GET] /search
    search(req, res) {
        res.send('HIII');
        
    }
}

module.exports = new SiteController();
