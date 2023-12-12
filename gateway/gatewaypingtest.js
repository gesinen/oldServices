module.exports = function(client,data) { 
	var db = require('../database/swat_db_test');	
    var parseData= JSON.parse(data);
	//console.log('Gateway Ping test')
	//console.log(parseData);	
	/* this is the sample message we recieve
	{
		"gatewayTimestamp" : "2021-01-18T08:27:32.8434921Z",
		"gatewayId" : "b827eb59b3b0"
	}
*/
	var gatewayId = parseData.gatewayId; //"b827eb59b3b0";
	var gatewayTimestamp = parseData.gatewayTimestamp; //"2021-01-18T08:27:32.8434921Z";
	gatewayTimestamp = gatewayTimestamp.replace(/T/, ' ').replace(/\..+/, '')
	db.getConnection(function(err,connection){
		if(err){
		console.log('error---:'+err);
		}		
		var query = "SELECT * from gateway_platform_test.gateway_ping where mac_number='"+ gatewayId +"'";
		
		var r = connection.query(query, function(err,results) { 
			//console.log(results)
			//var indexData = arr.indexOf( item );
			//console.log(indexData);
			
			if(results.length > 0)
			{				
				connection.query("UPDATE gateway_platform_test.gateway_ping SET message_datetime='"+gatewayTimestamp+"',status='Active',updated_dt=STR_TO_DATE('"+ gatewayTimestamp +"','%Y-%m-%d %T')  WHERE mac_number='"+gatewayId+"'",function(err,rows){
						   //connection.release();			 
							if(err) {					
							  console.log('updating gateway ping Error: ' + err);       
						}           
					});
			}
			else{
				connection.query("insert into gateway_platform_test.gateway_ping(mac_number,status,message_datetime,created_dt)values('"+ gatewayId +"','Active','"+ gatewayTimestamp +"',STR_TO_DATE('"+ gatewayTimestamp +"','%Y-%m-%d %T'))",function(err,rows){
						   //connection.release();			 
							if(err) {					
							  console.log('inserting gateway Ping Error: ' + err);       
						}           
					});
				
			}
		});
		connection.release();
	});
}