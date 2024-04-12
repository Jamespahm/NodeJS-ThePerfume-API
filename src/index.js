const path = require('path');
const express = require('express');
const methodOverride = require('method-override');
const moment = require('moment');
const handlebars = require('express-handlebars');
const app = express();

const db = require('./config/db');
const route = require('./routers/index.router');

const port = 8080;

// Add CORS middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3033');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, 'public')));

app.engine(
    'hbs',
    handlebars.engine({
        extname: '.hbs',
        helpers: {
            sum: (a, b) => a + b,
            formatDate: (date) => {
                return moment(date).format('HH:mm:ss DD-MM-YYYY ');
            },
        },
    }),
);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

//Connect to DB
db.connect();
//Router
route(app);

app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}`);
});
