const express = require('express');
const app = express();
// const morgan = require('morgan');

const db = require('./config/db');
const route = require('./routers/index.router');

const port = process.env.PORT || 8080;

// app.use(morgan('combined'));

//Connect to DB
db.connect();
// Add CORS middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3033');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
//Router
route(app);

app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}`);
});
