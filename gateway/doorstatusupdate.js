module.exports = function(client,data,header,macNumber) { 
		var db = require('../database/swat_db');	
        var parseData= JSON.parse(data);
		//var response = JSON.parse(parseData.response);
		var doorStatus= 1;
		console.log(header.join(''));
		var headerString = header.join('');
		
		
		var devEUI = parseData.devEUI;
		var sensorId  = '';
		var doorId = 0;
		 
		//if(devEUI == '0079e129d522e647'){
		
			db.getConnection(function(err,connection){	
				connection.query("select * from swat_gesinen.sensor_info where device_eui ='"+ devEUI+"'",function(err,rows){	
				connection.release();
					if(rows.length > 0){
						sensorId = rows[0].id;
						 typeSensorId = rows[0].type_sensor;
						db.getConnection(function(err,connection){			
							connection.query("select * from swat_gesinen.sensor_gateway_pkid where mac_number='"+macNumber+"' and sensor_id="+sensorId,function(err,results){
							connection.query("select * from swat_gesinen.sensor_type_ibox_payload where sensor_type_info_id ="+typeSensorId,function(err,iboxPayloadResult){
									//console.log(iboxPayloadResult);
							});	
							connection.query("select * from swat_gesinen.door where sensor_id="+sensorId,function(doorerr,doorResult){
								
								if(doorResult.length > 0){
									doorId = doorResult[0].id;
									console.log(doorId);
								}
								if(doorerr) {					
								  console.log('fetch door with sensor error: ' + err);
									connection.release();								  
								}
							
							connection.release();	
							//console.log(query); 			
								if(err) {					
								  console.log('fetch gatewaypkid with sensor error: ' + err);       
								}
								if(results.length > 0)
								{
								var currentDateTime = getDateTime();	
									if(headerString == '66640000')
									{
										//for close the door
										doorStatus = 2;
										queryUpdate="update swat_gesinen.door set status='"+ doorStatus +"',last_user = 'Unknown', last_opening = STR_TO_DATE('"+ currentDateTime +"','%d/%m/%Y %T') where sensor_id ="+sensorId;
										queryInsert= "insert into swat_gesinen.door_close_open_record (user_id,door_id,status,requested_datetime,created_at) values(-1 ,"+doorId+",'"+ doorStatus +"',STR_TO_DATE('"+ currentDateTime +"','%d/%m/%Y %T'),STR_TO_DATE('"+ currentDateTime +"','%d/%m/%Y %T') )";
									 console.log("close door ="+doorId);
									}
									else
									{
										//for open the door
										doorStatus = 1;
										queryUpdate="update swat_gesinen.door set status='"+ doorStatus +"', last_user = 'Unknown', last_opening =  STR_TO_DATE('"+ currentDateTime +"','%d/%m/%Y %T') where sensor_id ="+sensorId;
										queryInsert= "insert into swat_gesinen.door_close_open_record (user_id,door_id,status,requested_datetime,created_at) values(-1 ,"+doorId+",'"+ doorStatus +"',STR_TO_DATE('"+ currentDateTime +"','%d/%m/%Y %T'),STR_TO_DATE('"+ currentDateTime +"','%d/%m/%Y %T'))";
										console.log("open dooor = "+doorId);
									}
									db.getConnection(function(err,connection){			
										connection.query(queryUpdate,function(err,data){
										connection.release();	
										//console.log(query); 			
											if(err) {					
											  console.log('update Door Status error: ' + err);       
											}           
										});
									});	
									db.getConnection(function(err,connection){			
										connection.query(queryInsert,function(err,data){
										connection.release();	
										//console.log(query); 			
											if(err) {					
											  console.log('update door_close_open_record Status error: ' + err);       
											}           
										});
									});									
								}
							});
							});
						});
					}	
		
					if(err) {					
						console.log('fetch sensor Info Error: ' + err);       
					   }           
				});
			 
			});
		//}
}

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
    var currentTime     = calcTime('Madrid','+2');//new Date(); 
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
    var dateTime = day+'/'+month+'/'+year+' '+hour+':'+minute+':'+second;   
     return dateTime;
}