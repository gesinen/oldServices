module.exports = function(client,data,macNumber) { 
	var db = require('../database/swat_db');	
        var parseData= JSON.parse(data);
		var response = JSON.parse(parseData.response);
		console.log('sensorTypePayloadResponseAdd');
		console.log(response.pkId);
		console.log(macNumber);
		console.log(parseData.originalRequest.requestId);
		
		 var query="";		
		if(parseData.originalRequest.method == "POST")
			{
				console.log('insert query Ready');
			// query="update swat_gesinen.sensor_type_info set sensor_type_unique_id ='"+ response.pkId +"' where id='" +  parseData.originalRequest.requestId + "' ";
			  queryUpdate="update swat_gesinen.sensor_type_gateway_pkid set pk_id='"+ response.pkId +"' where mac_number ='"+ macNumber  +"' and  sensor_type_id=" +  parseData.originalRequest.requestId;
			queryInsert="INSERT INTO swat_gesinen.sensor_type_gateway_pkid (pk_id, mac_number, sensor_type_id) VALUES ("+response.pkId+", '"+macNumber+"', "+parseData.originalRequest.requestId+")";
			
			//console.log(response);	
			

	console.log(parseData.originalRequest.requestId);
	
	db.getConnection(function(err,connection){	
	connection.query("select * from swat_gesinen.sensor_type_gateway_pkid where sensor_type_id=" +  parseData.originalRequest.requestId + " ",function(err,rows){	
	connection.release();
	if(rows.length > 0) {
		console.log('updating');
		db.getConnection(function(err,connection){			
			connection.query(queryUpdate,function(err,data){
			connection.release();	
			//console.log(query); 			
			if(err) {					
			  console.log('update SENSOR type  error: ' + err);       
	   		}           
        	   });
     		 }); 

	  }
	  else {
		  console.log('inserting');
		db.getConnection(function(err,connection){			
			connection.query(queryInsert,function(err,data){
			connection.release();	
			//console.log(query); 			
			if(err) {					
			  console.log('insert SENSOR type  error: ' + err);       
	   		}           
        	   });
     		 }); 
	  }
	  if(err) {					
		console.log('update SENSOR type  error: ' + err);       
	   }           
         });
      }); 

}
}	