var mysql = require('mysql');
var settings = require('./swat_config_test.json');
var db;
function connectDatabase() {
    if (!db) {
        db = mysql.createPool(settings);  
		db.getConnection(function(err, connection) {
	    if(!err)
		    console.log('Database connection is OK with gateway_platform_test');
			else
			 console.log('Error in database connection' + err);
	   });
		 
    }
    return db;
}

module.exports = connectDatabase();