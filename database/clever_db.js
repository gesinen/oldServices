var mysql = require('mysql');
var settings = require('./clever_config.json');
var db;
function connectDatabase() {
    if (!db) {
        db = mysql.createPool(settings);  
		db.getConnection(function(err, connection) {
	    if(!err)
		    console.log('Database connection is OK');
			else
			 console.log('Error in database connection' + err);
	   });
		 
    }
    return db;
}

module.exports = connectDatabase();