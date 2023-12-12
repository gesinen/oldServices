var schedule = require('node-schedule');
var db = require('./database/db');	
  
var j = schedule.scheduleJob('*/1 * * * *', function(){
  	console.log('Start schedule....');
	db.getConnection(function(err,connection){
		connection.query("update ardumaster_web.device_info set device_status = 0 where date_add(last_connected, INTERVAL 30 SECOND) < NOW();",function(err,data){	
		//connection.query("select device_id,last_connected,device_status from ardumaster_web.device_info  where date_add(last_connected, INTERVAL 30 SECOND) < NOW();",function(err,data){
		connection.release();
//console.log(data);		
		if(err) {					
			  console.log('update device error: ' + err);       
	   	}       
         });
     }); 

});

 