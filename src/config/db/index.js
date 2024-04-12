// Get the client
const mysql = require('mysql2');

// Create the connection to database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'theperfumedb',
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ', err);
    }
});

module.exports = connection;
