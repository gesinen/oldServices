var each = require('sync-each');
var asyncLoop = require('node-async-loop');
var schedule = require('node-schedule');
var db = require('./database/swat_db');
var nodemailer = require('nodemailer');
var smtpConfig = {
    host: 'smtp.1and1.es',//'smtp.1and1.es',
    port: 465,//587,
    secure: true, // use SSL
    auth: {
        user: 'alarms@geswat.es',//'no-reply@gesinen.es',
        pass: 'Team@9765'
    }
};
var transporter = nodemailer.createTransport(smtpConfig);
  
var j = schedule.scheduleJob('0 0 */4 * * *', function(){
  	console.log('Start Generic Module Observation....');
	db.getConnection(function(err,connection){
		if(err){
		console.log('error---:'+err);
		}
		connection.query("select G.*,V.id  as variableId,V.variable_name as variableName,V.variable_unit as variableUnit,V.variable_varname as variableVarName,s.device_EUI as deviceEUI,s.name as sensorName from swat_gesinen.generic_define_device as G left join swat_gesinen.sensor_info as s ON G.sensor_id = s.id left join swat_gesinen.generic_device_variables as V ON V.generic_device = G.id",function(err,rows){	
			//console.log(rows);
			if(rows.length > 0) {
				asyncLoop(rows, function(element, next) {
					//console.log(rows);
					
					let data = {
						deviceId:element.id,
						deviceName:element.name,
						sensorName:element.sensorName,
						sensorId : element.sensor_id,
						userId : element.user_id,
						deviceEUI : element.deviceEUI,
						provider : element.generic_provider,
						token : element.generic_token,
						url : element.generic_url,
						variableName : element.variableName,
						variableUnit : element.variableUnit,
						variableVarName : element.variableVarName,
						variableId : element.variableId,
						
						url : 'https://connecta.dival.es/sentilo-api'  //element.url
					}
					if(data.provider != "" && data.token != ""){
						
					
					requestForObservation(data,(error,res)=>{
						if(error){
							console.log('Error not getting Response',error);
							next();
						}
						else{						
						
						//console.log('resObservation',res);
						if(res.observations.length > 0){							
							
							/*if(data.wunit == 'liter'){
								var value = ((res.observations[0].value)/1000);
							}
							else{
								var value =  (res.observations[0].value);
							}*/
							var value =  (res.observations[0].value);
							var timestamp =  res.observations[0].timestamp;
							var time =  res.observations[0].time;
							var parts =timestamp.split('T');
							var datePart = parts[0];
							var timePart = parts[1];
							
							querySelect = "select * from swat_gesinen.generic_observations where variable_id = "+data.variableId+" and observation_time = STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T')";
									
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
									querySelect = "select * from swat_gesinen.generic_observations where variable_id = "+data.variableId+" order by id desc limit 1";
									connection.query(querySelect,function(err,rec){
										if(err){
											console.log('error in select');
											next();
										}
										if(rec.length > 0) {
											connection.query("select * from swat_gesinen.generic_define_alarm where generic_device_id="+data.deviceId+" and variable_one = "+data.variableId,function(err,alarms){
																										
															if(err) {					
																return console.log('insert error in water observation value normal: ' + err);       
															}
															console.log(alarms);
															if(alarms.length > 0){
																let status = '';
															asyncLoop(alarms, function(element) {
																switch(element.alarm_type) {
																	case 'Over':
																		console.log(element.alarm_type, element.over_value,value);
																		 status = 'active';
																		if(value > element.over_value){
																		insertNotification(element.alarm_type,element.deviceEUI,element.generic_device_id,element.sensor_id,element.user_id,element.description,status,element.id,element.email,element.over_value, value,element.variable_one);
																		}
																	break;
																	case 'Lower':
																	console.log(element.alarm_type, element.lower_value,value);
																	status = 'active';
																	if(value < element.lower_value){
																	insertNotification(element.alarm_type,element.deviceEUI,element.generic_device_id,element.sensor_id,element.user_id,element.description,status,element.id,element.email,element.lower_value, value,element.variable_one);
																	}
																	break;
																	case 'Distinct':
																	console.log(element.alarm_type, element.over_value,value);
																	break;
																  default:
																	console.log('default called');
																}
															});
															}
															
														});
											asyncLoop(rec, function(element) {
												
													queryInsert="INSERT INTO swat_gesinen.generic_observations (device_id, device_eui, variable_var_name,variable_id ,observation, observation_time, user_id) VALUES ("+data.deviceId+", '"+data.deviceEUI+"', '"+data.variableVarName+"',"+data.variableId+",'"+value+"', STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T'),'"+data.userId+"')";
													queryUpdateGenericDeviceVariable="UPDATE swat_gesinen.generic_device_variables set last_observation = '"+value+"', observation_time = STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T')  where `id` = "+data.variableId; 
													
														connection.query(queryInsert,function(err,result){
																										
															if(err) {					
																return console.log('insert error in water observation value normal: ' + err);       
															}          
														});
														connection.query(queryUpdateGenericDeviceVariable, (err, result) => {
																//	console.log('update water device',result);
																	//console.log('queryUpdateWaterDevice error',err)
																})
													
											});
											next();
									}
									else{
										
													
													queryInsert="INSERT INTO swat_gesinen.generic_observations (device_id, device_eui, variable_var_name,variable_id ,observation, observation_time, user_id) VALUES ("+data.deviceId+", '"+data.deviceEUI+"', '"+data.variableVarName+"',"+data.variableId+",'"+value+"', STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T'),'"+data.userId+"')";
													queryUpdateGenericDeviceVariable="UPDATE swat_gesinen.generic_device_variables set last_observation = '"+value+"', observation_time = STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T')  where `id` = "+data.variableId; 
														connection.query(queryInsert,function(err,result){
																									
															if(err) {					
																return console.log('insert error in water observation value first time: ' + err);       
															}          
														});
														connection.query(queryUpdateGenericDeviceVariable, (err, res) => {
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
							//NotificationEmailForNoObservation();
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
const requestForObservation = ({sensorName,sensorId,userId,deviceEUI,deviceId,deviceName,provider,token,url,variableVarName,variableId}, callback) => {
	console.log('data in request method',sensorName,sensorId,userId,deviceEUI,variableVarName,provider,url);
	//callback(undefined,data);
	var request = require('request');
    var options = {
						'method': 'GET',
						'url': url+'/data'+'/'+provider+'/'+sensorName+variableVarName,//'https://connecta.dival.es/sentilo-api/data/sumacarcer@geswat/'+sensorName+'s01',//replace s01 with varName when you want it get automatilly var name.
						'headers': {
							'IDENTITY_KEY': token,//'19230246bb3d820f1d33a652dd4b0c4223de551b3589d122481402b4cf5d3d99',
							'Content-Type': 'application/json',
							'sensorName':sensorName,
							'sensorId':sensorId,
							'userId':userId,
							'deviceEUI':deviceEUI,
							'deviceId':deviceId,
							'deviceName':deviceName,
							'variableVarName':variableVarName,
							'variableId':variableId,
							'provider':provider,
							'token':token,
							'url':url							
						},
						
						rejectUnauthorized: false
					};
    request(options, (error, response) => {
        if (error) {
            callback('Unable to get response for '+provider+', '+token+', '+url+', '+sensorName+'('+deviceEUI+')'+ error, undefined);
        }
		
		else {
	
			//console.log(response.statusCode);
			
			if(response.statusCode != 200){
			//console.log('response code'+response.statusCode);
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

function insertNotification(alarmType,deviceEUI,deviceId,sensorId,userId,description,status,defineAlarmId,email,AlertVal,Observed,variable_one){
	db.getConnection(function(err,connection){
		if(err){
		console.log('error---:'+err);
		}
		queryInsert="INSERT INTO swat_gesinen.generic_alarm_notification (alarm_type,deviceEUI,device_id, sensor_id, user_id,description,status,define_alarm_id,variable_one,observed_value,alarm_value) VALUES ('"+alarmType+"', '"+deviceEUI+"', '"+deviceId+"', '"+sensorId+"', '"+userId+"', '"+description+"','"+status+"','"+defineAlarmId+"','"+variable_one+"','"+Observed+"','"+AlertVal+"')";
		//db.getConnection(function(err,connection){			
			connection.query(queryInsert,function(err,data){
				//connection.release();	
			//	console.log(queryInsert);
			//	nextrequest = 1;
			console.log('Email-sending to-'+email);
								var mailOptions = {
						  from: 'no-reply@gesinen.es',//'no-reply@swat-id.gesinen.com',
						  to: email,
						  subject: 'Generic Alert',
						  html:'<h1 style="Color:red">Alert!</h1><p>Device: <strong>'+ deviceEUI+'</strong></p><p> Alarm: <strong>'+alarmType+'</strong></p><p> Detail: <strong>'+description+'</strong></p><p> Limit: <strong>'+AlertVal+'</strong></p> <p> Observed: <strong>'+Observed+'</strong></p>'
						 // text: 'Device '+deviceEUI+' Alarm  '+ alarmType +' detail '+ description
						};

						transporter.sendMail(mailOptions, function(error, info){
						  if (error) {
							console.log(error);
						  } else {
							console.log('Generic Alert Email sent: ' + info.response);
						  }
						});
				if(err) {					
					console.log('insert error in observation value: ' + err);
					//connection.release();					
				}
				connection.release();
			});
})
	}
function NotificationEmailForNoObservation(){		
			console.log('Email-sending to-');
								var mailOptions = {
						  from: 'alarms@geswat.es',//'no-reply@swat-id.gesinen.com',
						  to: 'sheshsingh55@gmail.com',
						  subject: 'Generic Alert',
						  html:'<h1 style="Color:red">Alert!</h1><p>No Observation</p>'
						 // text: 'Device '+deviceEUI+' Alarm  '+ alarmType +' detail '+ description
						};

						transporter.sendMail(mailOptions, function(error, info){
						  if (error) {
							console.log(error);
						  } else {
							console.log('Generic Alert Email sent: ' + info.response);
						  }
						});
	}