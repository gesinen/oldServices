var asyncLoop = require('node-async-loop');
var db = require('./database/swat_db');

  	console.log('Gateway Activity Log..');
	db.getConnection(function(err,connection){
		if(err){
		console.log('error---:'+err);
		}
		queryInsert="INSERT INTO swat_gesinen.gateway_mqtt_messages_log (complete_message,gateway_mac,topic, message_datetime) VALUES ('"+completeMessage+"', '"+gatewayMac+"', '"+topic+"', '"+message_datetime+"')";
		//db.getConnection(function(err,connection){			
			connection.query(queryInsert,function(err,data){
				//connection.release();	
			//	console.log(queryInsert);
			//	nextrequest = 1;											
				if(err) {					
					console.log('insert error in water gateway_mqtt_messages_log value: ' + err);
					//connection.release();					
				}
				connection.release();
			});
		
	});	

