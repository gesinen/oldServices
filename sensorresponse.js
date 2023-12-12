module.exports = function(client,data) { 
	var db = require('../database/swat_db');	
        var parseData= JSON.parse(data);
		console.log(parseData);
		/* var query="";		
		
	//if(parseData.CONN == 1) {
		 query="update swat_gesinen.sensor_info set sensor_unique_id='"+ lastConnected +"'";
//		 }
	
	
	db.getConnection(function(err,connection){			
	connection.query("select * from swat_gesinen.sensor_info where name='" +  parseData.applicationName + "'",function(err,rows){	
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
      }); */

}	