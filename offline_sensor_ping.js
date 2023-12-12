var schedule = require('node-schedule');
var db = require('./database/swat_db_test');
  
var j = schedule.scheduleJob('*/15 * * * *', function(){
  	console.log('Start schedule....');
	db.getConnection(function(err,connection){
		connection.query("update swat_gesinen.sensor_ping set status = 'Deactive' where date_add(message_datetime, INTERVAL 5 MINUTE) < NOW();",function(err,data){	
		//connection.query("select device_id,last_connected,device_status from ardumaster_web.device_info  where date_add(last_connected, INTERVAL 30 SECOND) < NOW();",function(err,data){
		connection.release();
//console.log(data);		
		if(err) {					
			  console.log('update sensor ping status error: ' + err);       
	   	}       
         });
     }); 

});