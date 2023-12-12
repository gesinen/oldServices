var each = require('sync-each');
var asyncLoop = require('node-async-loop');
var schedule = require('node-schedule');
var db = require('./database/swat_db');
  
var j = schedule.scheduleJob('0 0 */6 * * *', function(){
  	console.log('Start water Module scheduel....');
	db.getConnection(function(err,connection){
		if(err){
		console.log('error---:'+err);
		}
		//select w.id as deviceId, w.units as wunit, w.provider as wProvider, w.authToken as wAuthToken, w.sensor_id as sensorId, w.name as deviceName, w.variable_name as varId, w.user_id as userId, s.name as sensorname, s.device_eui as deviceEUI,s.sensor_model_name as sensorModelName, ssd.sensor_id as ssdsensorid, servers.provider_id as providerId, servers.authorization_token as authtoken, servers.server_url as url from swat_gesinen.water_devices as w inner join swat_gesinen.sensor_info as s ON w.sensor_id = s.id inner join swat_gesinen.sensor_server_detail as ssd ON s.id = ssd.sensor_id inner join swat_gesinen.servers as servers ON ssd.server_id = servers.id Order by deviceId DESC old query
		//select w.id as deviceId , w.units as wunit,w.provider as wProvider, w.authToken as wAuthToken ,w.sensor_id as sensorId,w.name as deviceName, w.variable_name as varId, w.user_id as userId,s.name as sensorname, s.device_eui as deviceEUI,s.sensor_model_name as sensorModelName, ssd.sensor_id as ssdsensorid, servers.provider_id as providerId, servers.authorization_token as authtoken, servers.server_url as url from swat_gesinen.water_devices as w left join swat_gesinen.sensor_info as s ON w.sensor_id = s.id left join swat_gesinen.sensor_server_detail as ssd ON s.id = ssd.sensor_id left join swat_gesinen.servers as servers ON ssd.server_id = servers.id  Order by deviceId DESC
		//select w.id as deviceId, w.units as wunit, w.provider as wProvider, w.authToken as wAuthToken, w.sensor_id as sensorId, w.name as deviceName, w.variable_name as varId, w.user_id as userId, s.name as sensorname, s.device_eui as deviceEUI,s.sensor_model_name as sensorModelName, ssd.sensor_id as ssdsensorid, servers.provider_id as providerId, servers.authorization_token as authtoken, servers.server_url as url from swat_gesinen.water_devices as w inner join swat_gesinen.sensor_info as s ON w.sensor_id = s.id inner join swat_gesinen.sensor_server_detail as ssd ON s.id = ssd.sensor_id inner join swat_gesinen.servers as servers ON ssd.server_id = servers.id Order by deviceId DESC
		connection.query("select w.id as deviceId , w.units as wunit,w.provider as wProvider, w.authToken as wAuthToken ,w.sensor_id as sensorId,w.name as deviceName, w.variable_name as varId, w.user_id as userId,s.name as sensorname, s.device_eui as deviceEUI,s.sensor_model_name as sensorModelName, ssd.sensor_id as ssdsensorid, servers.provider_id as providerId, servers.authorization_token as authtoken, servers.server_url as url from swat_gesinen.water_devices as w left join swat_gesinen.sensor_info as s ON w.sensor_id = s.id left join swat_gesinen.sensor_server_detail as ssd ON s.id = ssd.sensor_id left join swat_gesinen.servers as servers ON ssd.server_id = servers.id  Order by deviceId DESC",function(err,rows){	
			//console.log(rows.length);
			if(rows.length > 0) {
				asyncLoop(rows, function(element, next) {
					
					let data = {
						sensorName:element.sensorname,
						sensorId : element.sensorId,
						userId : element.userId,
						deviceEUI : element.deviceEUI,
						sensorModelName : element.sensorModelName,
						deviceId : element.deviceId,
						deviceName : element.deviceName,
						varId : null,//element.varId,
						varName:"S01",
						providerId : element.wProvider ? element.wProvider:element.providerId,
						authtoken : element.wAuthToken ? element.wAuthToken: element.authtoken,
						wunit : element.wunit,
						//wProviderId : element.wProvider,
						//wAuthToken : element.wAuthToken,
						url : 'https://connecta.dival.es/sentilo-api/data'  //element.url
					}
					if(data.providerId != "" && data.authtoken != ""){
						
					
					requestForObservation(data,(error,res)=>{
						if(error){
							console.log('Error not getting Response',error);
							next();
						}
						else{
							
						//else{
						//console.log('callback response data',res.observations[0]);
						//console.log('res',res);
						
						console.log('resObservation',res);
						if(res.observations.length > 0){							
							
							if(data.wunit == 'liter'){
								var value = res.observations[0].value;//((res.observations[0].value)/1000);
							}
							else{
								var value =  (res.observations[0].value);
							}
							if(element.sensorname == 'WaterExternalRAFGWTC70'){
							//console.log('observations',res.observations[0]);
							//console.log('requested data',data.sensorModelName,data.sensorName);
							//console.log('unit '+data.wunit);
							//console.log('provider and authtoken',data.providerId,data.authtoken);
							//console.log('sensor name and value',data.sensorName,value);
							}
							
							
							/*if(data.sensorModelName == 'ItronCyble5'){
								var value =  (res.observations[0].value);
							}
							else{
								var value =  ((res.observations[0].value)/1000);
							}*/
							var timestamp =  res.observations[0].timestamp;
							var time =  res.observations[0].time;
							var parts =timestamp.split('T');
							var datePart = parts[0];
							var timePart = parts[1];
							
							//console.log('fullresponse','deviceId'+data.deviceId,'sensorId'+data.sensorId,data.deviceEUI,data.varId,value,timestamp);
							
							querySelect = "select * from swat_gesinen.water_module_observation where device_id = "+data.deviceId+" and message_timestamp = STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T')";
									
							connection.query(querySelect,function(err,record){
								
								if(err) {					
									return console.log('select statement error: ' + err);
									next();	
								}
								if(record.length > 0) {
									 // console.log('same record found for ',record[0].device_name);
									next();
								}
								else{
									querySelect = "select * from swat_gesinen.water_module_observation where device_id = "+data.deviceId+" and alert_type = 'normal' and observation_type = 'normal' order by id desc limit 1";
									connection.query(querySelect,function(err,rec){
										if(err){
											console.log('error in select');
											next();
										}
										if(rec.length > 0) {				
											asyncLoop(rec, function(element) {
												if(value < element.observation_value){
													//console.log('low value alert' ,value,element.observation_value,data.deviceName,data.deviceEUI);
													// add alert here for low value
													//continue;
													let alertType = 'lower';
													let observationType = 'abnormal';
													queryInsert="INSERT INTO swat_gesinen.water_module_observation (device_id, sensor_id, var_id,device_name,device_eui,var_name,observation_value,message_timestamp,time,user_id,alert_type,observation_type) VALUES ("+data.deviceId+", "+data.sensorId+", "+data.varId+", '"+data.deviceName+"', '"+data.deviceEUI+"','"+data.varName+"', "+value+", STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T'), '"+time+"','"+data.userId+"','"+alertType+"','"+observationType+"')";
													//db.getConnection(function(err,connection){			
														connection.query(queryInsert,function(err,result){
															//connection.release();	
														//	console.log(queryInsert);
														//	nextrequest = 1;											
															if(err) {					
																return console.log('insert error in water observation value lower: ' + err);       
															}           
														});
												}
												else if(value > (element.observation_value*5)){
												//	console.log('high value alert', value,element.observation_value,data.deviceName,data.deviceEUI);
													// add alert here for high value
													//continue;
													let alertType = 'high';
													let observationType = 'abnormal';
													queryInsert="INSERT INTO swat_gesinen.water_module_observation (device_id, sensor_id, var_id,device_name,device_eui,var_name,observation_value,message_timestamp,time,user_id,alert_type,observation_type) VALUES ("+data.deviceId+", "+data.sensorId+", "+data.varId+", '"+data.deviceName+"', '"+data.deviceEUI+"','"+data.varName+"', "+value+", STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T'), '"+time+"','"+data.userId+"','"+alertType+"','"+observationType+"')";
													//db.getConnection(function(err,connection){			
														connection.query(queryInsert,function(err,result){
															//connection.release();	
														//	console.log(queryInsert);
														//	nextrequest = 1;											
															if(err) {					
																return console.log('insert error in water observation value high: ' + err);       
															}           
														});
												}
												else{
													
													//console.log('insert value',value,element.observation_value,data.deviceName,data.deviceEUI);
													let alertType = 'normal';
													let observationType = 'normal';
													queryInsert="INSERT INTO swat_gesinen.water_module_observation (device_id, sensor_id, var_id, device_name, device_eui, var_name, observation_value, message_timestamp, time, user_id, alert_type, observation_type) VALUES ("+data.deviceId+", "+data.sensorId+", "+data.varId+", '"+data.deviceName+"', '"+data.deviceEUI+"','"+data.varName+"', "+value+", STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T'), '"+time+"','"+data.userId+"','"+alertType+"','"+observationType+"')";
													queryUpdateWaterDevice="UPDATE swat_gesinen.water_devices set last_observation = "+value+", last_message = STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T')  where `id` = "+data.deviceId; 
													queryInsertTemp="INSERT INTO swat_gesinen.hydric_balance_temp_observation (device_id, sensor_id, var_id,device_name,device_eui,var_name,observation_value,message_timestamp,time,user_id,alert_type,observation_type) VALUES ("+data.deviceId+", "+data.sensorId+", "+data.varId+", '"+data.deviceName+"', '"+data.deviceEUI+"','"+data.varName+"', "+value+", STR_TO_DATE('" + datePart + "','%d/%m/%Y %T'), '"+time+"','"+data.userId+"','"+alertType+"','"+observationType+"')";
													//db.getConnection(function(err,connection){
														//console.log('queryInsert',queryInsert);
														//console.log('queryInsertTemp',queryInsertTemp);
														connection.query(queryInsert,function(err,result){
															//connection.release();	
														//	console.log(queryInsert);
														//	nextrequest = 1;											
															if(err) {					
																return console.log('insert error in water observation value normal: ' + err);       
															} else {
																connection.query(queryInsertTemp, (err, res) => {
																 console.log('queryInsertTemp error',err)
																})
																
															}         
														});
														connection.query(queryUpdateWaterDevice, (err, result) => {
																//	console.log('update water device',result);
																	console.log('queryUpdateWaterDevice error',err)
																})
													//});
												}
											});
											next();
									}
									else{
										//console.log('esle first time insert value',value,element.observation_value,data.deviceName,data.deviceEUI);
													let alertType = 'normal';
													let observationType = 'normal';
													queryInsert="INSERT INTO swat_gesinen.water_module_observation (device_id, sensor_id, var_id,device_name,device_eui,var_name,observation_value,message_timestamp,time,user_id,alert_type,observation_type) VALUES ("+data.deviceId+", "+data.sensorId+", "+data.varId+", '"+data.deviceName+"', '"+data.deviceEUI+"','"+data.varName+"', "+value+", STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T'), '"+time+"','"+data.userId+"','"+alertType+"','"+observationType+"')";
													queryUpdateWaterDevice="UPDATE swat_gesinen.water_devices set last_observation = "+value+", last_message = STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T')  where `id` = "+data.deviceId; 
													queryInsertTemp="INSERT INTO swat_gesinen.hydric_balance_temp_observation (device_id, sensor_id, var_id,device_name,device_eui,var_name,observation_value,message_timestamp,time,user_id,alert_type,observation_type) VALUES ("+data.deviceId+", "+data.sensorId+", "+data.varId+", '"+data.deviceName+"', '"+data.deviceEUI+"','"+data.varName+"', "+value+", STR_TO_DATE('" + datePart + "','%d/%m/%Y %T'), '"+time+"','"+data.userId+"','"+alertType+"','"+observationType+"')";
													//db.getConnection(function(err,connection){
														//console.log('first time queryInsert',queryInsert);
														//console.log('first time queryInsertTemp',queryInsertTemp);														
														connection.query(queryInsert,function(err,result){
															//connection.release();	
														//	console.log(queryInsert);
														//	nextrequest = 1;											
															if(err) {					
																return console.log('insert error in water observation value first time: ' + err);       
															} else {
																connection.query(queryInsertTemp, (err, res) => {
																	console.log('queryInsertTemp error',err);
																})
																
															}         
														});
														connection.query(queryUpdateWaterDevice, (err, res) => {
																	//console.log('update water device',res);
																	console.log('queryUpdateWaterDevice error',err);
																})
													//});
									next();
										
									}
									});
									
								}
							});
							//next();
						}
						else{							
							console.log('No Observations');
							setTimeout(function(){
								next();
								}, 1000);
							//next();
						}
							//}
							}
					});
					}
					else{						
						console.log(' there is something missing in data'+data);
						next();
					}	
					
				});
				connection.release();
			}
		});
	});	
});

const requestForObservation = ({sensorName,sensorId,userId,deviceEUI,sensorModelName,deviceId,deviceName,varId,providerId,authtoken,url}, callback) => {
	console.log('data in request method',sensorName,sensorId,userId,deviceEUI);
	//callback(undefined,data);
	var request = require('request');
    var options = {
						'method': 'GET',
						'url': url+'/'+providerId+'/'+sensorName+'S01',//'https://connecta.dival.es/sentilo-api/data/sumacarcer@geswat/'+sensorName+'s01',//replace s01 with varName when you want it get automatilly var name.
						'headers': {
							'IDENTITY_KEY': authtoken,//'19230246bb3d820f1d33a652dd4b0c4223de551b3589d122481402b4cf5d3d99',
							'Content-Type': 'application/json',
							'sensorName':sensorName,
							'sensorId':sensorId,
							'userId':userId,
							'deviceEUI':deviceEUI,
							'sensorModelName':sensorModelName,
							'deviceId':deviceId,
							'deviceName':deviceName,
							'varId':varId,
							'varName':'S01',
							'providerId':providerId,
							'authtoken':authtoken,
							'url':url							
						},
						
						rejectUnauthorized: false
					};
    request(options, (error, response) => {
        if (error) {
            callback('Unable to get response for '+providerId+', '+authtoken+', '+url+', '+sensorName+'('+deviceEUI+')'+ error, undefined);
        }
		
		else {
	
			console.log(response.statusCode);
			
			if(response.statusCode != 200){
			console.log('response code'+response.statusCode);
			callback('response code'+response.statusCode, undefined);
			}
			else{
				//console.log('response body',response.body);			
			let res = JSON.parse(response.body);			 
            callback(undefined, res);
			}
			
			
			
        }
    });
}