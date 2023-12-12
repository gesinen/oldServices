module.exports = function(client,data,mac) { 
	var db = require('../database/swat_db_test');	
    var parseData= JSON.parse(data);
	//console.log('Sensor Ping Test')
	//console.log(parseData);	
	var devEUI = parseData.devEUI; //"b827eb59b3b0";
	
	var messageTime = getDateTime();//gatewayTimestamp.replace(/T/, ' ').replace(/\..+/, '')
	//console.log('sensor ping test',messageTime);
	db.getConnection(function(err,connection){
		if(err){
		console.log('error---:'+err);
		}		
		var query = "SELECT * from gateway_platform_test.sensor_ping where device_EUI='"+ devEUI +"'";
		
		var r = connection.query(query, function(err,results) { 
			//console.log(results)
			//var indexData = arr.indexOf( item );
			//console.log(indexData);
			
			if(results.length > 0)
			{				
				connection.query("UPDATE gateway_platform_test.sensor_ping SET message_datetime='"+messageTime+"',status='Active',updated_dt=STR_TO_DATE('"+ messageTime +"','%Y-%m-%d %T')  WHERE device_EUI='"+devEUI+"'",function(err,rows){
						   //connection.release();			 
							if(err) {					
							  console.log('updating sensor ping Error: ' + err);       
						}           
					});
			}
			else{
				connection.query("insert into gateway_platform_test.sensor_ping(device_EUI,mac_number,status,message_datetime,created_dt)values('"+ devEUI +"','"+ mac +"','Active','"+ messageTime +"',STR_TO_DATE('"+ messageTime +"','%Y-%m-%d %T'))",function(err,rows){
						   //connection.release();			 
							if(err) {					
							  console.log('inserting sensor Ping Error: ' + err);       
						}           
					});
				
			}
		});
		connection.release();
	});
	
	function calcTime(city, offset) {

    // create Date object for current location
    d = new Date();
    
    // convert to msec
    // add local time zone offset 
    // get UTC time in msec
    utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    
    // create new Date object for different city
    // using supplied offset
    nd = new Date(utc + (3600000*offset));
    
    // return time as a string
	return nd.toLocaleString();
    //return "The local time in " + city + " is " + nd.toLocaleString();

}

 function getDateTime() {
    var currentTime     = calcTime('Madrid','+1');//new Date(); 
	var now =  new Date(currentTime);
	var year    = now.getFullYear();
    var month   = now.getMonth()+1; 
    var day     = now.getDate();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds(); 
    if(month.toString().length == 1) {
        var month = '0'+month;
    }
    if(day.toString().length == 1) {
        var day = '0'+day;
    }   
    if(hour.toString().length == 1) {
        var hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
        var minute = '0'+minute;
    }
    if(second.toString().length == 1) {
        var second = '0'+second;
    }   
    var dateTime = year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second;   
     return dateTime;;
 }
}