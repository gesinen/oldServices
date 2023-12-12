module.exports = function(client,data,macNumber) { 
	var db = require('../database/swat_db');	
        var parseData= JSON.parse(data);
		var response = JSON.parse(parseData.response);
		//console.log(parseData);
		console.log('Sensor Response file',response);
		
		 var query="";
		let pkid = response.id;
		if(pkid == undefined){
			pkid = response.pkId;
		}
		if(parseData.originalRequest.method == "POST")
			{
				console.log('pkid- '+pkid,'mac_number- '+macNumber,'sensor_id- '+parseData.originalRequest.requestId);
				
				//console.log(macNumber);
			 //query="update swat_gesinen.sensor_info set sensor_unique_id='"+ response.pkId +"' where id='" +   parseData.originalRequest.requestId + "' ";
			  queryUpdate="update swat_gesinen.sensor_gateway_pkid set pk_id="+ pkid +" where mac_number ='"+ macNumber  +"' and  sensor_id=" +  parseData.originalRequest.requestId;
			queryInsert="INSERT INTO swat_gesinen.sensor_gateway_pkid (pk_id, mac_number, sensor_id) VALUES ("+pkid+", '"+macNumber+"', "+parseData.originalRequest.requestId+")";
			//console.log(queryInsert);	
			

	console.log(response.componentName);
	
	db.getConnection(function(err,connection){	
	connection.query("select * from swat_gesinen.sensor_gateway_pkid where sensor_id=" +  parseData.originalRequest.requestId + " and mac_number= '"+ macNumber+"'",function(err,rows){	
	connection.release();
	if(rows.length > 0) {
		db.getConnection(function(err,connection){			
			connection.query(queryUpdate,function(err,data){
			connection.release();
			console.log('updating');
			//console.log(query); 			
			if(err) {					
			  console.log('update SENSOR error: ' + err);       
	   		}           
        	   });
     		 }); 

	  }
	   else {
		db.getConnection(function(err,connection){			
			connection.query(queryInsert,function(err,data){
			connection.release();
			console.log('inserting');			
			//console.log(query); 			
			if(err) {					
			  console.log('insert sensor error: ' + err);       
	   		}           
        	   });
     		 });
	  }
	  if(err) {					
		console.log('update SENSOR error: ' + err);       
	   }           
         });
      }); 

}
}	