const express = require('express')
const app = express()
// const morgan = require('morgan');

const db = require('./config/db');
const route = require('./routers/index.router');

const port = 3000

// app.use(morgan('combined'));

//Connect to DB
db.connect();
//Router
route(app);

app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`)
})