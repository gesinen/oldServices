module.exports = function(client,data) { 
	var db = require('../database/db');	
        var parseData= JSON.parse(data);	
	var query="";		
		var lastConnected = parseData.DATE+''+parseData.TIME;
	if(parseData.CONN == 1) {
		 query="update ardumaster_web.device_info set device_status=1,last_time=STR_TO_DATE('"+ lastConnected +"','%d/%m/%Y %T'),last_connected=now() where device_id='" + parseData.ID +"'";
		 }
	else
	{
	 	query="update ardumaster_web.device_info set device_status=0,last_time=STR_TO_DATE('"+ lastConnected +"','%d/%m/%Y %T'),last_connected=now() where device_id='" + parseData.ID +"'";		 
	}
	client.publish('gesinen2device/connection/'+ parseData.ID, '{"ID":"' + parseData.ID + '","CONN":"1"}') 
	db.getConnection(function(err,connection){			
	connection.query("select * from ardumaster_web.device_info where device_id='" +  parseData.ID + "'",function(err,rows){	
	connection.release();
	if(rows.length>0) {
		db.getConnection(function(err,connection){			
			connection.query(query,function(err,data){
			connection.release();	
			//console.log(query); 			
			if(err) {					
			  console.log('update device error: ' + err);       
	   		}           
        	   });
     		 }); 

	  }
	  else {
		console.log('device id does not exist'); 
	  }
	  if(err) {					
		console.log('update device error: ' + err);       
	   }           
         });
      }); 

}
 