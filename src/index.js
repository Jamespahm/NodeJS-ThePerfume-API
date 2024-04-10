const express = require('express')
const app = express()
const morgan = require('morgan');

const route = require('./routers/index.router');

const port = 3000


app.use(morgan('combined'));


route(app);

app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`)
})