const mqtt = require('mqtt')
const options = {
    // Clean session
    clean: true,
    connectTimeout: 4000,
    // Auth
    clientId: getRandomNumberStr(8),
    username: 'gesinen',
    password: 'gesinen2110',
}
const loop = require('node-async-loop');
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
const fs = require('fs');
const schedule = require('node-schedule');
const mysql = require('mysql');
//var btoa = require('btoa');

// Database
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Al8987154St12',
    //password: '',
    database: 'swat_gesinen'
});

// Asynchronous mysql query
async function query(sql) {
    return new Promise((resolve, reject) => {

        db.getConnection(function(err, connection) {

            if (err) {
                reject(err)
            } else {
                connection.query(sql, (err, rows) => {

                    if (err) {
                        reject(err)
                    } else {
                        resolve(rows)
                    }
                    // finaliza la sesión
                    connection.release()
                })
            }
        })
    })
}
const client = mqtt.connect('mqtts://gesinen.es:8882', options)

async function subscribeGateways() {
    //let querySql = "SELECT gateways.mac AS mac_number, sensor_info.device_EUI FROM generic_define_device INNER JOIN sensor_info ON sensor_info.id = generic_define_device.sensor_id INNER JOIN gateways ON gateways.sensors_id LIKE CONCAT('%', generic_define_device.sensor_id, '%')";
    let querySql = "SELECT gateways.mac AS mac_number From gateways";
	//console.log("querySql", querySql)

    let storedData = []
    query(querySql).then(rows => {
        rows.forEach(element => {
            storedData.push(element)
        });
        //console.log(storedData)
        storedData.forEach(element => {
            // Me subscribo a todos los gateways
            client.subscribe(element.mac_number + '/#', function(err) {
                if (!err) {
                    console.log("subscrito al gateway con mac: " + element.mac_number)
                } else {
                    console.log(err)
                }
            })
        });
    })
}

client.on('connect', function() {
    console.log('Connected')
    /*client.subscribe('reset/capacity/spot', function(err) {
            if (!err) {
                console.log("subscrito al topic de reset -> reset/capacity/spot")
            } else {
                console.log(err)
            }
        })*/
    subscribeGateways()
})

client.on('disconnect', function(err) {
    console.log("disconnect", err);
})

client.on('error', function(err) {
    console.log("error", err);
})
// It remains to know what topic and message
client.on('message', async function(topic, message) {
        if (topic != undefined) {
            
            let splitedTopic = topic.split("/")
			if (splitedTopic[1] == "application" && splitedTopic[3] == "device" && splitedTopic[5] == "rx") {
                console.log(topic, "topic")
				let deviceEUI = splitedTopic[4]
                let gatewayMac = splitedTopic[0]
                let messageFormated = JSON.parse(message.toString())
                //console.log("message", messageFormated)
				let deviceInfos  =  await getDeviceAllInfo(deviceEUI);
				console.log(deviceInfos);
				if(deviceInfos.length > 0){
					loop(deviceInfos, async function(element, next) {
						let observation  = await requestToSentiloForObservation(element.sensorName,element.generic_provider,element.generic_token,element.generic_url,element.variableVarName);
						console.log('observation',observation,observation.observations.length);
						if(observation.observations.length > 0){
							
							var value =  (observation.observations[0].value);
							var timestamp =  observation.observations[0].timestamp;
							var time =  observation.observations[0].time;
							var parts =timestamp.split('T');
							var datePart = parts[0];
							var timePart = parts[1];
							let observationMatched = await checkObservationIsMatchedInDB(element.variableId,datePart,timePart);
							console.log('observationMatched',observationMatched,observationMatched.length)
							if(observationMatched.length > 0){
							next();
							}
							else{
							let alarms	 = await checkAlarmsDefinedForThisInDB(element.id,element.variableId);
							console.log('alarms',alarms);
							if(alarms.length > 0){
								let status = '';
								loop(alarms, async function(alarm) {
									switch(alarm.alarm_type) {
										case 'Over':
											status = 'active';
											console.log('over alarm')
											if(value > alarm.over_value){
												if(alarm.triggerType == 'Send After Recovery'){
													let lastObs = await getTheLastObservationFromDBFoVariable(alarm.variable_one);
													if(lastObs[0].observation < alarm.over_value){
														await InsertNotification(alarm.alarm_type,alarm.deviceEUI,alarm.generic_device_id,alarm.sensor_id,alarm.user_id,alarm.description,status,alarm.id,alarm.email,alarm.over_value, value,alarm.variable_one)
													}
												}
												else if(alarm.triggerType == 'Send Always'){
													await InsertNotification(alarm.alarm_type,alarm.deviceEUI,alarm.generic_device_id,alarm.sensor_id,alarm.user_id,alarm.description,status,alarm.id,alarm.email,alarm.over_value, value,alarm.variable_one)
												}
												else{
													let notification = await checkNotificationAlreadySendForthatAlarm(alarm.alarm_type,alarm.deviceEUI,alarm.generic_device_id,alarm.id,alarm.variable_one);
													console.log('notification',notification);
													
													console.log(alarm.alarm_type,alarm.over_value,value,);
													if(notification.length > 0 ){
														
													}
													else{
														await InsertNotification(alarm.alarm_type,alarm.deviceEUI,alarm.generic_device_id,alarm.sensor_id,alarm.user_id,alarm.description,status,alarm.id,alarm.email,alarm.over_value, value,alarm.variable_one)
													}
												}
											}
											break;
										case 'Lower':
											console.log(alarm.alarm_type, alarm.lower_value,value);
											status = 'active';
											if(value < alarm.lower_value){
												if(alarm.triggerType == 'Send After Recovery'){
													let lastObs = await getTheLastObservationFromDBFoVariable(alarm.variable_one);
													if(lastObs[0].observation > alarm.lower_value){
														await InsertNotification(alarm.alarm_type,alarm.deviceEUI,alarm.generic_device_id,alarm.sensor_id,alarm.user_id,alarm.description,status,alarm.id,alarm.email,alarm.over_value, value,alarm.variable_one)
													}
												}
												else if(alarm.triggerType == 'Send Always'){
													await InsertNotification(alarm.alarm_type,alarm.deviceEUI,alarm.generic_device_id,alarm.sensor_id,alarm.user_id,alarm.description,status,alarm.id,alarm.email,alarm.over_value, value,alarm.variable_one)
												}
												else{
													let notification = await checkNotificationAlreadySendForthatAlarm(alarm.alarm_type,alarm.deviceEUI,alarm.generic_device_id,alarm.id,alarm.variable_one);
													console.log('notification',notification);
													if(notification.length > 0 ){
														
													}
													else{
														await InsertNotification(alarm.alarm_type,alarm.deviceEUI,alarm.generic_device_id,alarm.sensor_id,alarm.user_id,alarm.description,status,alarm.id,alarm.email,alarm.lower_value, value,alarm.variable_one);
													}
												}
											}
											break;
										case 'Distinct':
											let lastObservationFromDb = await getTheLastObservationFromDBFoVariable(alarm.variable_one);
											if(alarm.triggerType == 'Send After Recovery'){
												if(alarm.distinctVal != lastObservationFromDb[0].observation && value == alarm.distinctVal){
													status = 'active';
													await InsertNotification(alarm.alarm_type,alarm.deviceEUI,alarm.generic_device_id,alarm.sensor_id,alarm.user_id,alarm.description,status,alarm.id,alarm.email,'Distinct', value,alarm.variable_one);
												}
												
											}
											else if(alarm.triggerType == 'Send Always' && alarm.distinctVal  == value){
												status = 'active';
													await InsertNotification(alarm.alarm_type,alarm.deviceEUI,alarm.generic_device_id,alarm.sensor_id,alarm.user_id,alarm.description,status,alarm.id,alarm.email,'Distinct', value,alarm.variable_one);
												
											}
											else{
												//console.log('lastObservationFromDb',lastObservationFromDb,lastObservationFromDb[0].observation,value);
												if(lastObservationFromDb[0].observation != value){
													let notification = await checkNotificationAlreadySendForthatAlarm(alarm.alarm_type,alarm.deviceEUI,alarm.generic_device_id,alarm.id,alarm.variable_one);
												console.log('notification',notification);
												if(notification.length > 0 ){
													
												}else{
													status = 'active';
													await InsertNotification(alarm.alarm_type,alarm.deviceEUI,alarm.generic_device_id,alarm.sensor_id,alarm.user_id,alarm.description,status,alarm.id,alarm.email,'Distinct', value,alarm.variable_one);
													console.log(alarm.alarm_type, alarm.over_value,value,'Distinct');
												}
												}
											}
											break;
										default:
											console.log('default called');
									}
								})
							}
							let insert = await InsertObservationInDB(element.id,element.deviceEUI,element.variableVarName,element.variableId,element.user_id,value,datePart,timePart);
							console.log('insert',insert);
							let update = await updateVariableObservationInDB(element.variableId,value,datePart,timePart);	
							console.log('update',update);
							next();
							}
						}
						else{
						next();
						}
					});
				
				}
            }
        }
    });

async function getDeviceAllInfo(deviceEUI) {
    let sqlGetInfo = "select G.*,V.id  as variableId,V.variable_name as variableName,V.variable_unit as variableUnit,V.variable_varname as variableVarName,s.device_EUI as deviceEUI,s.name as sensorName from swat_gesinen.generic_define_device as G left join swat_gesinen.sensor_info as s ON G.sensor_id = s.id left join swat_gesinen.generic_device_variables as V ON V.generic_device = G.id WHERE s.device_EUI = '" + deviceEUI + "'";
    //console.log(sqlGetInfo);
	let res = await query(sqlGetInfo)
    //console.log("res", res)
    return res;
    
}
async function checkObservationIsMatchedInDB(variableId,datePart,timePart) {
    let sqlGetInfo = "select * from swat_gesinen.generic_observations where variable_id = "+variableId+" and observation_time = STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T')";
    //console.log(sqlGetInfo);
	let res = await query(sqlGetInfo)
    //console.log("res", res)
    return res;
    
}

async function checkNotificationAlreadySendForthatAlarm(alarmType,deviceEUI,deviceId,defineAlarmId,variable_one) {
    let sqlGetInfo = "select * from swat_gesinen.generic_alarm_notification where alarm_type = '"+alarmType+"' and define_alarm_id = "+defineAlarmId+" and deviceEUI = '"+deviceEUI+"' and variable_one = '"+variable_one+"' and device_id = "+deviceId+"  and created_dt  = (SELECT MAX(generic_alarm_notification.created_dt) FROM generic_alarm_notification WHERE generic_alarm_notification.define_alarm_id = "+defineAlarmId+" and generic_alarm_notification.alarm_type = '"+alarmType+"' and generic_alarm_notification.deviceEUI = '"+deviceEUI+"' and generic_alarm_notification.variable_one = '"+variable_one+"' and status != 'solved' );";
    //console.log(sqlGetInfo);
	let res = await query(sqlGetInfo)
    //console.log("res", res)
    return res;
    
}
async function getTheLastObservationFromDBFoVariable(variableId) {
    let sqlGetInfo = "select * from swat_gesinen.generic_observations where variable_id = "+variableId+" order by id desc limit 1";
    //console.log(sqlGetInfo);
	let res = await query(sqlGetInfo)
    //console.log("res", res)
    return res;
    
}

async function checkAlarmsDefinedForThisInDB(deviceId,variableId) {
    let sqlGetInfo = "select * from swat_gesinen.generic_define_alarm where generic_device_id="+deviceId+" and variable_one = "+variableId;
   // console.log(sqlGetInfo);
	let res = await query(sqlGetInfo)
    //console.log("res", res)
    return res;
    
}

async function InsertNotification(alarmType,deviceEUI,deviceId,sensorId,userId,description,status,defineAlarmId,email,AlertVal,Observed,variable_one) {
    let sqlGetInfo = "INSERT INTO swat_gesinen.generic_alarm_notification (alarm_type,deviceEUI,device_id, sensor_id, user_id,description,status,define_alarm_id,variable_one,observed_value,alarm_value) VALUES ('"+alarmType+"', '"+deviceEUI+"', "+deviceId+", "+sensorId+", "+userId+", '"+description+"','"+status+"',"+defineAlarmId+",'"+variable_one+"','"+Observed+"','"+AlertVal+"')";
    let res = await query(sqlGetInfo);
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
	
    console.log("variable_one Insert notification", variable_one,alarmType);
    return res;
    
}

async function InsertObservationInDB(deviceId,deviceEUI,variableVarName,variableId,userId,value,datePart,timePart) {
    let sqlGetInfo = "INSERT INTO swat_gesinen.generic_observations (device_id, device_eui, variable_var_name,variable_id ,observation, observation_time, user_id) VALUES ("+deviceId+", '"+deviceEUI+"', '"+variableVarName+"',"+variableId+",'"+value+"', STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T'),'"+userId+"')";
    let res = await query(sqlGetInfo)
    console.log("variableId Insert Observation", variableId);
    return res;
    
}

async function updateVariableObservationInDB(variableId,value,datePart,timePart) {
	
    let sqlGetInfo = "UPDATE swat_gesinen.generic_device_variables set last_observation = '"+value+"', observation_time = STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T')  where `id` = "+variableId;
    //console.log(sqlGetInfo);
	let res = await query(sqlGetInfo)
	console.log("updted Insert Observation", variableId);
    return res;
    
}
async function requestToSentiloForObservation(sensorName,provider,token,url,variableVarName) {
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': url+'/data'+'/'+provider+'/'+sensorName+variableVarName,
        'headers': {
            'IDENTITY_KEY': token,
            'Content-Type': 'application/json'
        },
        };
    //console.log("Get SENTILO REQUEST", options)
	return new Promise(function(resolve, reject){
		request(options, function (error, response, body) {
			if (error) return reject(error);
			try {
                // JSON.parse() can throw an exception if not valid JSON
				//console.log(body);
                resolve(JSON.parse(body));
            } catch(e) {
                reject(e);
            }
		});
	});
    
}

	
	function getRandomNumberStr(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}