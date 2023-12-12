module.exports = function(client,data,macNumber) { 
	var db = require('../database/swat_db');	
        var parseData= JSON.parse(data);
		var response = JSON.parse(parseData.response);
		//console.log(parseData);
		console.log(response);
		
		 var query="";
		 
		let appId = "";
		let responseResult = response.result;
		console.log('response result',responseResult);
		responseResult.forEach(element => {
			console.log('in foreach',element.name,element.id);
			//if(element.name == 'app')
			//{
				appId = element.id;
			//}
		});
		console.log('appId',appId);
		
		if(parseData.originalRequest.method == "GET")
			{
				
				//console.log(macNumber);
			 //query="update swat_gesinen.sensor_info set sensor_unique_id='"+ response.pkId +"' where id='" +   parseData.originalRequest.requestId + "' ";
			  queryUpdate="update swat_gesinen.gateways set application="+ appId +" where mac ='"+ macNumber  +"'";
			
	
	db.getConnection(function(err,connection){	
	connection.query("select * from swat_gesinen.gateways where mac = '"+ macNumber+"'",function(err,rows){	
	connection.release();
	if(rows.length > 0) {
		db.getConnection(function(err,connection){			
			connection.query(queryUpdate,function(err,data){
			connection.release();	
			//console.log(query); 			
			if(err) {					
			  console.log('update Gateway ApplicationId  error: ' + err);       
	   		}           
        	   });
     		 }); 

	  }	   
	  if(err) {					
		console.log('update Gateway ApplicationId  error: ' + err);       
	   }           
         });
      }); 

}
}	