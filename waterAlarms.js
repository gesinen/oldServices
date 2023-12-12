var each = require('sync-each');
var asyncLoop = require('node-async-loop');
var schedule = require('node-schedule');
var db = require('./database/swat_db');
var nodemailer = require('nodemailer');
var smtpConfig = {
    host: 'smtp.1and1.es',
    port: 587,
    //secure: true, // use SSL
    auth: {
        user: 'alarms@geswat.com',//'no-reply@gesinen.es',
        pass: 'Team@9765'
    }
};

var transporter = nodemailer.createTransport(smtpConfig);
  
var j = schedule.scheduleJob('*/1 * * * *', function(){
  	console.log('Water Alarm Schedular..');
	db.getConnection(function(err,connection){
		if(err){
		console.log('error---:'+err);
		}		
		connection.query("select w.id as deviceId, w.sensor_id as sensorId, w.name as deviceName, w.variable_name as varId, w.user_id as userId, s.name as sensorname, s.device_eui as deviceEUI,s.sensor_model_name as sensorModelName, ssd.sensor_id as ssdsensorid, servers.provider_id as providerId, servers.authorization_token as authtoken, servers.server_url as url from swat_gesinen.water_devices as w inner join swat_gesinen.sensor_info as s ON w.sensor_id = s.id inner join swat_gesinen.sensor_server_detail as ssd ON s.id = ssd.sensor_id inner join swat_gesinen.servers as servers ON ssd.server_id = servers.id",function(err,rows){	
			//console.log(rows);
			//connection.release();
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
					
				//	console.log(sensorName,sensorId,deviceEUI,deviceId,deviceName,varId,providerId,url,authtoken);
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
						
					request(options, function (error, response,body) {
						//console.log(options);
						//nextrequest = 1;
						if (error) throw new Error(error);
						if(response.statusCode == 200){
						//console.log('device',deviceName);
						//console.log('status',response.statusCode);
						//console.log('response',response.request.uri.href);
						//console.log('body',body);
						 var res = JSON.parse(body);
						//console.log(JSON.parse(response.body));
						//console.log('res',res);
						
						if(res.observations.length > 0  ){
						if(res.observations[0]){
						//console.log('observation',res.observations[0].value,res.observations[0].timestamp,res.observations[0].time);
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
						//console.log('fullresponse',sensorId,deviceEUI,varId);
						querySelect = "select * from swat_gesinen.water_module_observation where device_id = "+deviceId+"  and message_timestamp = STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T')";
						//db.getConnection(function(err,connection){			
							connection.query(querySelect,function(err,record){
								if(err) {					
									console.log('select statement error: ' + err);       
								}
								// If the same record found for device with same time
								if(record.length > 0) {
									//console.log('same record found',record);
									//console.log('same record found');
									//nextrequest = 1;
								}
								else{
									querySelect = "select * from swat_gesinen.water_define_alarm where water_device_id = "+deviceId;
						//db.getConnection(function(err,connection){			
							connection.query(querySelect,function(err,record){
								//connection.release();
							//	console.log(querySelect);
								if(err) {					
									console.log('select statement error: ' + err);       
								}
								// found the alarms defined for this device
								if(record.length > 0) {
									console.log('Alarms List',record);
									record.forEach(element => {
										if(element.water_device_id == deviceId){
										switch(element.alarm_type) {
											  case 'Lower':
												console.log('this is lower Alarm',element.lower_value, value);
												if(element.lower_value >= value){
													console.log('this is lower Alarm',element.lower_value,'<=',value);
													let description = 'this is lower value Alarm';
													let status = 'active';
													insertValueInDatabase(element.alarm_type,element.deviceEUI,element.water_device_id,element.sensor_id,element.user_id,description,status,element.id,element.email,element.lower_value, value);
												}
												break;
											  case 'Over':
												console.log('this is over Alarm');
												if(element.over_value <= value){
													console.log('this is over Alarm',element.over_value,'>=',value);
													let description = 'this is Over value Alarm';
													let status = 'active';
													insertValueInDatabase(element.alarm_type,element.deviceEUI,element.water_device_id,element.sensor_id,element.user_id,description,status,element.id,element.email,element.over_value, value);
												}
												break;
											 case 'Reverse Mounting':
												console.log('this is Reverse Mounting Alarm');
												var queryDaily = "select * from swat_gesinen.water_module_observation where device_id = "+deviceId+" and  Date(message_timestamp) = STR_TO_DATE('"+today+"','%Y-%m-%d') and observation_type = 'normal' and alert_type = 'normal' LIMIT 3";
												connection.query(queryDaily,function(err,rec){
													if(err) {					
														console.log('select statement error: ' + err);       
													}
													console.log('daily rec',rec,rec.length);
													let diff = 0;
													if(rec.length = 3) {														
														reverseMounting = 0; 
														for (var i = 0; i < rec.length-1; i++) {
															
															if (rec[i].observation_value > rec[i+1].observation_value) {
																reverseMounting = reverseMounting + 1;
															}      
														}
														if(reverseMounting == 2){
															console.log('this is Reverse Mounting Alarm',element.reverse_mounting_value,'>=',value);
															let description = 'this is Reverse Mounting Alarm';
															let status = 'active';
															insertValueInDatabase(element.alarm_type,element.deviceEUI,element.water_device_id,element.sensor_id,element.user_id,description,status,element.id,element.email,element.reverse_mounting_value, value);
														}												
													}
													
												});													
												break;
												
											 case 'Daily':
												console.log('this is Daily Alarm');
												var today = new Date().toISOString().slice(0, 10);
												console.log('date',today);
												var queryDaily = "select * from swat_gesinen.water_module_observation where device_id = "+deviceId+" and  Date(message_timestamp) = STR_TO_DATE('"+today+"','%Y-%m-%d')";
												connection.query(queryDaily,function(err,rec){
													if(err) {					
														console.log('select statement error: ' + err);       
													}
													console.log('daily rec',rec,rec.length);
													let diff = 0;
													if(rec.length > 1) {
														diff = rec[rec.length -1].observation_value - rec[0].observation_value;
														if(diff >  element.daily_value){
															console.log('daily difference is more insert the value in database.',diff,element.daily_value);
															let description = 'this is Daily limit value Alarm';
															let status = 'active';
															insertValueInDatabase(element.alarm_type,element.deviceEUI,element.water_device_id,element.sensor_id,element.user_id,description,status,element.id,element.email,element.daily_value, Number(diff.toFixed(3)));
														}
													}
													
												});												
												break;
											case 'Weekly':
												console.log('this is weekly Alarm');
												var today = new Date().toISOString().slice(0, 10);
												console.log('date',today);
												var queryDaily = "select * from swat_gesinen.water_module_observation where device_id = "+deviceId+" and   YEARWEEK(message_timestamp) = YEARWEEK(STR_TO_DATE('"+today+"','%Y-%m-%d')) and observation_type = 'normal' and alert_type = 'normal'";
												connection.query(queryDaily,function(err,rec){
													if(err) {					
														console.log('select statement error: ' + err);       
													}
													console.log('weekly rec',rec,rec.length);
													let diff = 0;
													if(rec.length > 1) {
														
														diff = rec[rec.length -1].observation_value - rec[0].observation_value;
														console.log('difference',Number(diff.toFixed(3)),Number((element.weekly_value).toFixed(3)));
														if(Number(diff.toFixed(3)) >  Number((element.weekly_value).toFixed(3))){
															console.log('weekly difference is more insert the value in database.',diff,element.weekly_value);
															let description = 'this is Weekly limit value Alarm';
															let status = 'active';
															insertValueInDatabase(element.alarm_type,element.deviceEUI,element.water_device_id,element.sensor_id,element.user_id,description,status,element.id,element.email,element.daily_value, Number(diff.toFixed(3)));
														}
													}
													
												});	
												
												break;
											case 'Monthly':
												console.log('this is Monthly Alarm');
												var today = new Date().toISOString().slice(0, 10);
												console.log('date',today);
												var queryDaily = "select * from swat_gesinen.water_module_observation where device_id = "+deviceId+" and  year(message_timestamp) = year(STR_TO_DATE('"+today+"','%Y-%m-%d')) and month(message_timestamp) = month(STR_TO_DATE('"+today+"','%Y-%m-%d')) and observation_type = 'normal' and alert_type = 'normal'";
												connection.query(queryDaily,function(err,rec){
													if(err) {					
														console.log('select statement error: ' + err);       
													}
													console.log('monthly rec',rec.length);
													let diff = 0;
													if(rec.length > 1) {
														
														diff = rec[rec.length -1].observation_value - rec[0].observation_value;
														console.log('difference',Number(diff.toFixed(3)),Number((element.monthly_value).toFixed(3)));
														if(Number(diff.toFixed(3)) >  Number((element.monthly_value).toFixed(3))){
															console.log('monthly difference is more insert the value in database.',diff,element.monthly_value);
															let description = 'this is Monthly Limit value Alarm';
															let status = 'active';
															insertValueInDatabase(element.alarm_type,element.deviceEUI,element.water_device_id,element.sensor_id,element.user_id,description,status,element.id,element.email,element.daily_value, Number(diff.toFixed(3)));
														}
													}
													
												});	
												
												break;	
											  default:
												// code block
											}
										}
										})
								}								
							});
									
								}
							});
						
						//});
					}
					}
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

function insertValueInDatabase(alarmType,deviceEUI,deviceId,sensorId,userId,description,status,defineAlarmId,email,AlertVal,Observed){
	db.getConnection(function(err,connection){
		if(err){
		console.log('error---:'+err);
		}
		queryInsert="INSERT INTO swat_gesinen.water_alarm_notification (alarm_type,deviceEUI,device_id, sensor_id, user_id,description,status,define_alarm_id) VALUES ('"+alarmType+"', '"+deviceEUI+"', '"+deviceId+"', '"+sensorId+"', '"+userId+"', '"+description+"','"+status+"','"+defineAlarmId+"')";
		//db.getConnection(function(err,connection){			
			connection.query(queryInsert,function(err,data){
				//connection.release();	
			//	console.log(queryInsert);
			//	nextrequest = 1;
			console.log('Email-sending to-'+email);
								var mailOptions = {
						  from: 'no-reply@swat-id.gesinen.com',
						  to: email,
						  subject: 'Water Alert',
						  html:'<h1 style="Color:red">Alert!</h1><p>Device: <strong>'+ deviceEUI+'</strong></p><p> Alarm: <strong>'+alarmType+'</strong></p><p> Detail: <strong>'+description+'</strong></p><p> Limit: <strong>'+AlertVal+'</strong></p> <p> Observed: <strong>'+Observed+'</strong></p>'
						 // text: 'Device '+deviceEUI+' Alarm  '+ alarmType +' detail '+ description
						};

						transporter.sendMail(mailOptions, function(error, info){
						  if (error) {
							console.log(error);
						  } else {
							console.log('Water Alert Email sent: ' + info.response);
						  }
						});
				if(err) {					
					console.log('insert error in water observation value: ' + err);
					//connection.release();					
				}
				connection.release();
			});
})
	}