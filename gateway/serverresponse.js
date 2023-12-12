module.exports = function(client,data,macNumber) { 
	var db = require('../database/swat_db');	
        var parseData= JSON.parse(data);
		var response = JSON.parse(parseData.response);
		//console.log(parseData);
		console.log(response,parseData.originalRequest.requestId);
		
		
		 var query="";		
		if(parseData.originalRequest.method == "POST")
			{
			 queryUpdate="update swat_gesinen.server_gateway_pkid set pk_id='"+ response.pkId +"' where mac_number ='"+ macNumber  +"' and  server_id=" +  parseData.originalRequest.requestId;
			queryInsert="INSERT INTO swat_gesinen.server_gateway_pkid (pk_id, mac_number, server_id) VALUES ("+response.pkId+", '"+macNumber+"', "+parseData.originalRequest.requestId+")";
		
			//console.log(response);	
			

	console.log(response.serverName);
	
	db.getConnection(function(err,connection){
		if(err){
			console.log('err', err);
		}
	connection.query("select * from swat_gesinen.server_gateway_pkid where mac_number ='"+ macNumber  +"' and  server_id=" +  parseData.originalRequest.requestId ,function(err,rows){	
	connection.release();
	console.log('rows',rows);
	if(rows.length > 0) {
		db.getConnection(function(error,connection){
				if(error){
					console.log('connection error',error);
				}
			connection.query(queryUpdate,function(err,data){
				console.log('updated');
			connection.release();	
			//console.log(query); 			
			if(err) {					
			  console.log('update Server error: ' + err);       
	   		}           
        	   });
     		 }); 

	  }
	  else {
		db.getConnection(function(error,connection){
			if(error){
					console.log('connection error',error);
				}			
			connection.query(queryInsert,function(err,data){
				console.log('inserted');
			connection.release();	
			//console.log(query); 			
			if(err) {					
			  console.log('insert Server error: ' + err);       
	   		}           
        	   });
     		 });
	  }
	  if(err) {					
		console.log('update Server error: ' + err);       
	   }           
         });
      }); 

}
}	