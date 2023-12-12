const options = {
    // Clean session
    clean: true,
    connectTimeout: 4000,
    // Auth
    clientId: getRandomNumberStr(8),
    username: 'gesinen',
    password: 'gesinen2110',
}
const asyncLoop = require('node-async-loop');
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
/*const mqtt = require('mqtt')
const client = mqtt.connect('mqtts://gesinen.es:8882', options)
client.on('connect', function() {
    console.log('Connected')
})
client.on('disconnect', function(err) {
    console.log("disconnect", err);
})

client.on('error', function(err) {
    console.log("error", err);
})*/

//var j = schedule.scheduleJob('0 0 */6 * * *', async function(){
	async function main(){
	let allDevices = await getAllTheDevicesToGetObservation();
	console.log('total Devices',allDevices.length);
	if(allDevices.length > 0) {
		asyncLoop(allDevices, async function(element, next) {
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
				let observation  = await requestToSentiloForObservation(data);
				if(observation.observations.length > 0){
					if(data.wunit == 'liter'){
						var value = observation.observations[0].value;//((res.observations[0].value)/1000);
					}
					else{
						var value =  (observation.observations[0].value);
					}
					console.log('observation',observation.observations);
					var timestamp =  observation.observations[0].timestamp;
					var time =  observation.observations[0].time;
					var parts =timestamp.split('T');
					var datePart = parts[0];
					var timePart = parts[1];
					let ObservationMatchedInDB = await checkObservationIsMatchedInDB(data,datePart,timePart)
					if(ObservationMatchedInDB.length > 0) {
						//console.log('sameObservation Matched');
						next();
					}
					else{
						 let lastObservation = await getTheLastObservationFromDBForDevice(data);
						 if(lastObservation.length > 0){
							 if(value < lastObservation.observation_value){
								 let alertType = 'lower';
								 let observationType = 'abnormal';
								await InsertObservationInDB(data,value,datePart,timePart,time,alertType,observationType);
							 }
							 else if(value > (lastObservation.observation_value*5)){
								 let alertType = 'high';
								let observationType = 'abnormal';
								 await InsertObservationInDB(data,value,datePart,timePart,time,alertType,observationType);
								 
							 }
							 else{
								 let alertType = 'normal';
								let observationType = 'normal';
								await InsertObservationInDB(data,value,datePart,timePart,time,alertType,observationType)
								await updateWaterDeviceObservationInDB(data,value,datePart,timePart);
								await InsertObservationInDBHydricBalanceTempObservation(data,value,datePart,timePart,time,alertType,observationType);
							 }
							 let alarms  = await getAlarmsForTheDevice(data);
							 if(alarms.length > 0){
								 asyncLoop(alarms, async function(alarm, next) {
									 let status;
									 let description;
									 let currentDate;
									 let lastObservationFromDb;
									 switch(alarm.alarm_type) {
										case 'Over':
											 status = 'active';
											if(value > alarm.over_value){
												 description = 'This is over value Alert, Observed value '+value+' > '+alarm.over_value;
											await insertWaterAlarmNotification(alarm.alarm_type,data.deviceEUI,data.deviceId,data.sensor_id,data.user_id,description,status,alarm.id)
											}
											break;
										case 'Lower':
											console.log(alarm.alarm_type, alarm.lower_value,value);
											 status = 'active';
											if(value < alarm.lower_value){
											 description = 'This is Lower value Alert, Observed value '+value+' < '+alarm.lower_value;
											await insertWaterAlarmNotification(alarm.alarm_type,data.deviceEUI,data.deviceId,data.sensor_id,data.user_id,description,status,alarm.id);
											}
											break;
										case 'Reverse Mounting':											
												if(lastObservation.observation_value < value){
													 description = 'This is Reverse Mounting Alert, Observed value '+value+' is less than '+lastObservation.observation_value;
													 status = 'active';
													await insertWaterAlarmNotification(alarm.alarm_type,data.deviceEUI,data.deviceId,data.sensor_id,data.user_id,description,status,alarm.id);
													console.log(alarm.alarm_type, alarm.over_value,value,'Reverse Mounting');
												}
											break;
										case 'Daily':
											 currentDate = new Date().toJSON().slice(0, 10);
											let previouseDate = new Date((new Date()).valueOf() - 1000*60*60*24).toJSON().slice(0,10);
											 lastObservationFromDb = await getTheLastObservationFromDBForSelectedDate(data,previouseDate,currentDate);
												if(lastObservationFromDb.observation_value > alarm.daily_value){
													 description = 'This is Daily Alert, Observed value '+lastObservation.observation_value+' is more than '+alarm.daily_value;
													 status = 'active';
													await insertWaterAlarmNotification(alarm.alarm_type,data.deviceEUI,data.deviceId,data.sensor_id,data.user_id,description,status,alarm.id);
													console.log(alarm.alarm_type, alarm.daily_value,value,'Daily');
												}
											break;
										case 'Weekly':
											
										let d = new Date();
										var day = d.getDay(),
										diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
									 let weekFirstDay =  new Date(d.setDate(diff)).toJSON().slice(0,10);
									 currentDate = new Date().toJSON().slice(0, 10);

											 lastObservationFromDb = await getTheLastObservationFromDBForSelectedDate(data,weekFirstDay,currentDate);
												if(lastObservationFromDb.observation_value != alarm.weekly_value){
													 description = 'This is week Alert, Observed value '+lastObservation.observation_value+' is more than '+alarm.weekly_value;
													 status = 'active';
													await insertWaterAlarmNotification(alarm.alarm_type,data.deviceEUI,data.deviceId,data.sensor_id,data.user_id,description,status,alarm.id);
													console.log(alarm.alarm_type, alarm.weekly_value,value,'Weekly');
												}
											break;
										case 'Monthly':
												 currentDate = new Date().toJSON().slice(0, 10);
												 d=new Date(); // current date
													d.setDate(1); // going to 1st of the month
												let previouseMonthLastDate	 = new Date(d.setHours(-1)).toJSON().slice(0,10);
											 lastObservationFromDb = await getTheLastObservationFromDBForSelectedDate(data,previouseMonthLastDate,currentDate);
												if(lastObservationFromDb.observation_value != alarm.monthly_value){
													 description = 'This is Monthly Alert, Observed value '+lastObservation.observation_value+' is more than '+alarm.monthly_value;
													 status = 'active';
													await insertWaterAlarmNotification(alarm.alarm_type,data.deviceEUI,data.deviceId,data.sensor_id,data.user_id,description,status,alarm.id);
													console.log(alarm.alarm_type, alarm.monthly_value,value,'Monthly');
												}
											break;
										default:
											console.log('default called');
									}
								 });
							 }
							 
						 }
						 else{
							 
							  let alertType = 'normal';
								let observationType = 'normal';
								await InsertObservationInDB(data,value,datePart,timePart,time,alertType,observationType)
								await updateWaterDeviceObservationInDB(data,value,datePart,timePart);
								await InsertObservationInDBHydricBalanceTempObservation(data,value,datePart,timePart,time,alertType,observationType);
						 }
						 
						 next();
						
					}
					
				}
				else{
					console.log('No Observations');
					setTimeout(function(){
						next();
						}, 1000);
				}
				
			}
			else{
				console.log(' there is something missing in data'+data);
				next();
				
			}
			
			
		});
		
	}
	}
//});
main();
async function getAllTheDevicesToGetObservation(deviceEUI) {
    let sqlGetInfo = "select w.id as deviceId , w.units as wunit,w.provider as wProvider, w.authToken as wAuthToken ,w.sensor_id as sensorId,w.name as deviceName, w.variable_name as varId, w.user_id as userId,s.name as sensorname, s.device_eui as deviceEUI,s.sensor_model_name as sensorModelName, ssd.sensor_id as ssdsensorid, servers.provider_id as providerId, servers.authorization_token as authtoken, servers.server_url as url from swat_gesinen.water_devices as w left join swat_gesinen.sensor_info as s ON w.sensor_id = s.id left join swat_gesinen.sensor_server_detail as ssd ON s.id = ssd.sensor_id left join swat_gesinen.servers as servers ON ssd.server_id = servers.id  Order by deviceId DESC";
    let res = await query(sqlGetInfo)
    //console.log("res", res)
    return res;
    
}

async function requestToSentiloForObservation({sensorName,sensorId,userId,deviceEUI,sensorModelName,deviceId,deviceName,varId,providerId,authtoken,url}) {
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': url+'/'+providerId+'/'+sensorName+'S01',
        'headers': {
            'IDENTITY_KEY': authtoken,
            'Content-Type': 'application/json'
        },
        };
    //console.log("Get SENTILO REQUEST", options,deviceId)
	return new Promise(function(resolve, reject){
		request(options, function (error, response, body) {
			if (error) return reject(error);
			try {
                // JSON.parse() can throw an exception if not valid JSON
				console.log(body);
                resolve(JSON.parse(body));
            } catch(e) {
                reject(e);
            }
		});
	});
    
}

async function checkObservationIsMatchedInDB(data,datePart,timePart) {
    let sqlGetInfo = "select * from swat_gesinen.water_module_observation where device_id = "+data.deviceId+" and message_timestamp = STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T')";
    let res = await query(sqlGetInfo)
    //console.log("res", res)
    return res;
    
}

async function getTheLastObservationFromDBForDevice(data) {
    let sqlGetInfo = "select * from swat_gesinen.water_module_observation where device_id = "+data.deviceId+" and alert_type = 'normal' and observation_type = 'normal' order by id desc limit 1";
    let res = await query(sqlGetInfo)
    //console.log("res", res)
    return res;    
}

async function getTheLastObservationFromDBForSelectedDate(data, date1 , date2){
	let previouseObservation = "select observation_value from water_module_observation where message_timestamp between "+date1+" and  "+ date1 +"' 23:59:59'and  device_id ="+ data.deviceId +"order by message_timestamp desc limit 1";
    let prev = await query(previouseObservation)
	let latestedObservation = "select observation_value from water_module_observation where message_timestamp between  "+date2+" and  "+ date2 +"' 23:59:59'and  device_id = "+ data.deviceId +" order by message_timestamp desc limit 1";
	let latest = await query(latestedObservation)
	let difference = latest.observation_value - prev.observation_value;
    //console.log("res", res)
    return difference;
}
async function InsertObservationInDB(data,value,datePart,timePart,time,alertType,observationType) {
    let sqlGetInfo = "INSERT INTO swat_gesinen.water_module_observation (device_id, sensor_id, var_id,device_name,device_eui,var_name,observation_value,message_timestamp,time,user_id,alert_type,observation_type) VALUES ("+data.deviceId+", "+data.sensorId+", "+data.varId+", '"+data.deviceName+"', '"+data.deviceEUI+"','"+data.varName+"', "+value+", STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T'), '"+time+"','"+data.userId+"','"+alertType+"','"+observationType+"')";
    let res = await query(sqlGetInfo)
    console.log("variableId Insert Observation", data.deviceId);
    return res;
    
}
async function updateWaterDeviceObservationInDB(data,value,datePart,timePart) {
    let sqlGetInfo = "UPDATE swat_gesinen.water_devices set last_observation = "+value+", last_message = STR_TO_DATE('" + datePart + " " + timePart + "','%d/%m/%Y %T')  where `id` = "+data.deviceId;
    let res = await query(sqlGetInfo)
	console.log("updted Insert Observation", data.deviceId);
    return res;
    
}
async function InsertObservationInDBHydricBalanceTempObservation(data,value,datePart,timePart,time,alertType,observationType) {
    let sqlGetInfo = "INSERT INTO swat_gesinen.hydric_balance_temp_observation (device_id, sensor_id, var_id,device_name,device_eui,var_name,observation_value,message_timestamp,time,user_id,alert_type,observation_type) VALUES ("+data.deviceId+", "+data.sensorId+", "+data.varId+", '"+data.deviceName+"', '"+data.deviceEUI+"','"+data.varName+"', "+value+", STR_TO_DATE('" + datePart + "','%d/%m/%Y %T'), '"+time+"','"+data.userId+"','"+alertType+"','"+observationType+"')";
    let res = await query(sqlGetInfo)
    console.log("variableId Insert Observation", data.deviceId);
    return res;
    
}
async function getAlarmsForTheDevice(data,value,datePart,timePart,time,alertType,observationType) {
    let sqlGetInfo = "select WAAWDR.device_id as DeviceId, WAAWDR.waterDefineAlarm_id as AlarmId, alarm.* from waterAlarmAndWaterDeviceRelation as WAAWDR  Inner Join water_define_alarm as alarm On WAAWDR.waterDefineAlarm_id =alarm.id  where WAAWDR.device_id ="+ data.deviceId;
    let res = await query(sqlGetInfo)
    console.log("getAlarms", data.deviceId);
    return res;
    
}
async function insertWaterAlarmNotification(alarm_type,deviceEUI,deviceId,sensor_id,user_id,description,status,alarmId) {
    let sqlGetInfo = "INSERT INTO swat_gesinen.water_alarm_notification (alarm_type, deviceEUI, device_id,sensor_id,user_id,description,status,define_alarm_id) VALUES ('"+alarm_type+"', '"+deviceEUI+"', "+deviceId+", "+sensor_id+", "+user_id+",'"+description+"', '"+status+"', "+alarmId+")";
    let res = await query(sqlGetInfo)
    console.log("Alert Insert Observation", deviceId);
    return res;
    
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