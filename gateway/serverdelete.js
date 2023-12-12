module.exports = function(client,data,macNumber) { 
	var db = require('../database/swat_db');	
        var parseData= JSON.parse(data);
		//var response = JSON.parse(parseData.response);
		console.log(parseData);
		//var patharray =  ((parseData.originalRequest.path).toString()).split('/');
		//console.log(response);
		
		 var query="";		
		if(parseData.originalRequest.method == "DELETE")
			{
			 // query="update swat_gesinen.servers set pk_id="+null+" where id=" +  parseData.originalRequest.requestId;
			 queryUpdate="update swat_gesinen.server_gateway_pkid set pk_id="+ null +" where mac_number ='"+ macNumber  +"' and  server_id=" +  parseData.originalRequest.requestId;
			//console.log(response);		

	//console.log(patharray[1]);
	
	db.getConnection(function(err,connection){	
	connection.query("select * from swat_gesinen.servers where id=" +  parseData.originalRequest.requestId ,function(err,rows){	
	connection.release();
	if(rows.length > 0) {
		db.getConnection(function(err,connection){			
			connection.query(queryUpdate,function(err,data){
			connection.release();	
			//console.log(query); 			
			if(err) {					
			  console.log('update Server error: ' + err);       
	   		}           
        	   });
     		 }); 

	  }
	  else {
		console.log('Server id does not exist'); 
	  }
	  if(err) {					
		console.log('update Server error: ' + err);       
	   }           
         });
      }); 

}
}	