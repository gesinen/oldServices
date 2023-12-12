var each = require('sync-each');
var asyncLoop = require('node-async-loop');
var schedule = require('node-schedule');
var db = require('./database/swat_db');
  
var j = schedule.scheduleJob('*/10 * * * *', function(){
  	console.log('Start water Module scheduel....');
	db.getConnection(function(err,connection){
		if(err){
		console.log('error---:'+err);
		}
		//"select w.id as deviceId, w.sensor_id as sensorId,w.name as deviceName,w.variable_name as varId,s.name as sensorname, s.device_eui as deviceEUI, p.var_name from swat_gesinen.water_devices as w inner join swat_gesinen.sensor_info as s ON w.sensor_id = s.id inner join swat_gesinen.sensor_type_payload as p ON w.variable_name = p.id "
		connection.query("select w.id as deviceId, w.sensor_id as sensorId, w.name as deviceName, w.variable_name as varId, w.user_id as userId, s.name as sensorname, s.device_eui as deviceEUI,s.sensor_model_name as sensorModelName, ssd.sensor_id as ssdsensorid, servers.provider_id as providerId, servers.authorization_token as authtoken, servers.server_url as url from swat_gesinen.water_devices as w inner join swat_gesinen.sensor_info as s ON w.sensor_id = s.id inner join swat_gesinen.sensor_server_detail as ssd ON s.id = ssd.sensor_id inner join swat_gesinen.servers as servers ON ssd.server_id = servers.id Order by deviceId ASC limit 1999",function(err,rows){	
			//console.log(rows);
			//connection.release();
			console.log(rows.length);
			if(rows.length > 0) {
				//async.forEachOf(rows, function(element, key, next){
					//console.log(rows);
				asyncLoop(rows, function(element, next) {
				//rows.forEach(element => {
				//each(rows,function (element,next) {
					var nextrequest = 0;
					var  sensorName = element.sensorname;
					var  sensorId = element.sensorId;
					var  userId = element.userId;
					var deviceEUI = element.deviceEUI;
					var sensorModelName = element.sensorModelName;
					
					var  deviceId = element.deviceId;
					var  deviceName = element.deviceName;
					
					var  varId = element.varId;
					var  providerId = element.providerId;
					var  authtoken = element.authtoken
					var  url = element.url;
					
					//console.log(sensorName,sensorId,deviceEUI,deviceId,deviceName,varId,providerId,url,authtoken);
					var geturl = url+'/'+providerId+'/'+sensorName+'S01';
					//console.log('url',geturl);
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
							'providerId':providerId,
							'authtoken':authtoken,
							'url':url,
							
							
						},
						
						rejectUnauthorized: false
					};
					//if(nextrequest == 0){
						
					request(options, function (error, response) {
						//console.log(options);
						//nextrequest = 1;
						if(error){
							return console.log('Error Please solve', error);
						}
						//if (error) throw new Error(error);
						//console.log('device',deviceName);
						console.log('response',response);
						 var res = JSON.parse(response.body);
						//console.log(JSON.parse(response.body));
						if(res.observations[0]){
						//console.log(res.observations[0].value,res.observations[0].timestamp,res.observations[0].time);
						if(sensorModelName == 'ItronCyble5'){
						var value =  (res.observations[0].value);
						}
						else{
						var value =  ((res.observations[0].value)/1000);
						}
						var timestamp =  res.observations[0].timestamp;
						var time =  res.observations[0].time;
						var parts =timestamp.split('T');
						var datePart = parts[0];
						var timePart = parts[1];
						var headersValue = response.request.headers;
					//	console.log('Headers Values',headersValue);
						
						var  HsensorName = headersValue.sensorname;
						var  HsensorId = headersValue.sensorId;
						var HdeviceEUI = headersValue.deviceEUI;
						
						var  HdeviceId = headersValue.deviceId;
						var  HdeviceName = headersValue.deviceName;
						
						var  HvarId = headersValue.varId;
						var  HvarName = headersValue.varName;
						console.log('fullresponse','deviceId'+deviceId,'sensorId'+sensorId,deviceEUI,varId,value,timestamp);
						querySelect = "select * from swat_gesinen.water_module_observation where device_id = "+deviceId+" and message_timestamp = STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T')";
						//db.getConnection(function(err,connection){			
							connection.query(querySelect,function(err,record){
								//connection.release();
							//	console.log(querySelect);
								if(err) {					
									console.log('select statement error: ' + err);       
								}
								if(record.length > 0) {
									//console.log('same record found',record);
									//nextrequest = 1;
								}
								else{
									querySelect = "select * from swat_gesinen.water_module_observation where device_id = "+deviceId+" and alert_type = 'normal' and observation_type = 'normal' order by id desc limit 1";
									connection.query(querySelect,function(err,rec){
										
										if(rec.length > 0) {				
											asyncLoop(rec, function(element, next) {
												if(value < element.observation_value){
													console.log('low value alert' ,value,element.observation_value,deviceName,deviceEUI);
													// add alert here for low value
													//continue;
													let alertType = 'lower';
													let observationType = 'abnormal';
													queryInsert="INSERT INTO swat_gesinen.water_module_observation (device_id, sensor_id, var_id,device_name,device_eui,var_name,observation_value,message_timestamp,time,user_id,alert_type,observation_type) VALUES ("+deviceId+", "+sensorId+", "+varId+", '"+deviceName+"', '"+deviceEUI+"','S01', "+value+", STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T'), '"+time+"','"+userId+"','"+alertType+"','"+observationType+"')";
													//db.getConnection(function(err,connection){			
														connection.query(queryInsert,function(err,data){
															//connection.release();	
														//	console.log(queryInsert);
														//	nextrequest = 1;											
															if(err) {					
																console.log('insert error in water observation value: ' + err);       
															}           
														});
												}
												else if(value > (element.observation_value*5)){
													console.log('high value alert', value,element.observation_value,deviceName,deviceEUI);
													// add alert here for high value
													//continue;
													let alertType = 'high';
													let observationType = 'abnormal';
													queryInsert="INSERT INTO swat_gesinen.water_module_observation (device_id, sensor_id, var_id,device_name,device_eui,var_name,observation_value,message_timestamp,time,user_id,alert_type,observation_type) VALUES ("+deviceId+", "+sensorId+", "+varId+", '"+deviceName+"', '"+deviceEUI+"','S01', "+value+", STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T'), '"+time+"','"+userId+"','"+alertType+"','"+observationType+"')";
													//db.getConnection(function(err,connection){			
														connection.query(queryInsert,function(err,data){
															//connection.release();	
														//	console.log(queryInsert);
														//	nextrequest = 1;											
															if(err) {					
																console.log('insert error in water observation value: ' + err);       
															}           
														});
												}
												else{
													
													console.log('insert value',value,element.observation_value,deviceName,deviceEUI);
													let alertType = 'normal';
													let observationType = 'normal';
													queryInsert="INSERT INTO swat_gesinen.water_module_observation (device_id, sensor_id, var_id,device_name,device_eui,var_name,observation_value,message_timestamp,time,user_id,alert_type,observation_type) VALUES ("+deviceId+", "+sensorId+", "+varId+", '"+deviceName+"', '"+deviceEUI+"','S01', "+value+", STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T'), '"+time+"','"+userId+"','"+alertType+"','"+observationType+"')";
													queryUpdateWaterDevice="UPDATE swat_gesinen.water_devices set last_observation = "+value+", last_message = STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T')  where `id` = "+deviceId; 
													queryInsertTemp="INSERT INTO swat_gesinen.hydric_balance_temp_observation (device_id, sensor_id, var_id,device_name,device_eui,var_name,observation_value,message_timestamp,time,user_id,alert_type,observation_type) VALUES ("+deviceId+", "+sensorId+", "+varId+", '"+deviceName+"', '"+deviceEUI+"','S01', "+value+", STR_TO_DATE('" + datePart + "','%d/%m/%Y %T'), '"+time+"','"+userId+"','"+alertType+"','"+observationType+"')";
													//db.getConnection(function(err,connection){			
														connection.query(queryInsert,function(err,data){
															//connection.release();	
														//	console.log(queryInsert);
														//	nextrequest = 1;											
															if(err) {					
																console.log('insert error in water observation value: ' + err);       
															} else {
																connection.query(queryInsertTemp, (err, data) => {
																	console.log(err)
																})
																
															}         
														});
														connection.query(queryUpdateWaterDevice, (err, data) => {
																	console.log('update water device',data);
																	console.log(err)
																})
													//});
												}
											})
									}
									else{
										console.log('esle first time insert value',value,element.observation_value,deviceName,deviceEUI);
													let alertType = 'normal';
													let observationType = 'normal';
													queryInsert="INSERT INTO swat_gesinen.water_module_observation (device_id, sensor_id, var_id,device_name,device_eui,var_name,observation_value,message_timestamp,time,user_id,alert_type,observation_type) VALUES ("+deviceId+", "+sensorId+", "+varId+", '"+deviceName+"', '"+deviceEUI+"','S01', "+value+", STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T'), '"+time+"','"+userId+"','"+alertType+"','"+observationType+"')";
													queryUpdateWaterDevice="UPDATE swat_gesinen.water_devices set last_observation = "+value+", last_message = STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T')  where `id` = "+deviceId; 
													queryInsertTemp="INSERT INTO swat_gesinen.hydric_balance_temp_observation (device_id, sensor_id, var_id,device_name,device_eui,var_name,observation_value,message_timestamp,time,user_id,alert_type,observation_type) VALUES ("+deviceId+", "+sensorId+", "+varId+", '"+deviceName+"', '"+deviceEUI+"','S01', "+value+", STR_TO_DATE('" + datePart + "','%d/%m/%Y %T'), '"+time+"','"+userId+"','"+alertType+"','"+observationType+"')";
													//db.getConnection(function(err,connection){			
														connection.query(queryInsert,function(err,data){
															//connection.release();	
														//	console.log(queryInsert);
														//	nextrequest = 1;											
															if(err) {					
																console.log('insert error in water observation value: ' + err);       
															} else {
																connection.query(queryInsertTemp, (err, data) => {
																	console.log(err)
																})
																
															}         
														});
														connection.query(queryUpdateWaterDevice, (err, data) => {
																	console.log('update water device',data);
																	console.log(err)
																})
													//});
										
									}
									});
									
								}
							});
						//});
					}
						
					});
					//}
					//if(nextrequest = 1){
						
					next();
					//}
				});
				connection.release();
			}
		});
	});	
});