var nodemailer = require('nodemailer');
var request = require('request');
var smtpConfig = {
	name:'smtp.ionos.es',
    host: 'smtp.1and1.es',//'smtp.1and1.es',
    port: 465,//587,
    secure: true, // use SSL
    auth: {
        user: 'alarms@geswat.es',//'no-reply@gesinen.es',
        pass: 'Team@9765'
    }
};

var transporter = nodemailer.createTransport(smtpConfig);
const schedule = require('node-schedule');
const asyncLoop = require('node-async-loop');
const mysql = require('mysql');



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

var j = schedule.scheduleJob('*/5 * * * *', async function(){
	async function main(){
		//console.log('main');
		const alarms = await getAllAlarms();
		//console.log('alarms',alarms['data'].db);
		
		alarms['data'].db.forEach((element) => {
      try {
        processAlarm(element);
      } catch (error) {
        console.log("[ERROR]: ", error);
      }
    });
}
main();
});

async  function getAllAlarms() {
	 var options = {
            'method': 'GET',
            'url': 'https://stage.swat-id.gesinen.com/v2/service/alarm', //'http://localhost:8080/v2/boiler/devices/service/info',
            'headers': {
                'Content-Type': 'application/json'
            }
	};
	return new Promise(function(resolve, reject){
		request(options, function (error, response, body) {
			if (error) return reject(error);
			try {
                // JSON.parse() can throw an exception if not valid JSON
			//	console.log(body);
                resolve(JSON.parse(body));
            } catch(e) {
                reject(e);
            }
		});
	});
    
}
// Process Alarm
  async function processAlarm(element) {
   // console.log("ELEMENT: ", element);
    
	//console.log(element.device);
    let device ; 
    if (!element.timeToConsiderDeactive) {
      throw new Error("Cant found available timeToConsiderDeactive.");
    }
    // Process Gateways in this Alarm
    if (element.device && element.device['gateway'].length > 0) {
      //console.log("Gateway: ", element.device['gateway']);
	asyncLoop(element.device['gateway'], async function(item, next) {
		let gatewayRes = await getByMac(item.mac_number);
		let gatewayInfo =  await getByMacGatewayInfo(item.mac_number);
		let alarmNotification  =  await getLastAlarmForSelectedGateway(item.mac_number,element.id);
		//console.log('gatewayRes',gatewayRes);
		let alarmAtive = checkTime(gatewayRes[0].message_datetime, element.timeToConsiderDeactive);
		//console.log('gatewayRes',alarmAtive,gatewayRes[0].status);
		if(alarmAtive){
			if( alarmNotification.length > 0){
				console.log('notification already Send for this gateway');
			}
			else{
			//await updateAlarmFlag(element.id, true);
			//console.log(gatewayInfo[0].id, gatewayInfo[0].name);
			await insertNotificationForAlarm(element.id,element.user_creator,item.mac_number,null,null,'generated',element.description,element.email,element.text,gatewayInfo[0].name,null);
		 var mailOptions = {
						  from: 'alarms@geswat.es',//'no-reply@swat-id.gesinen.com',
						  to: element.email,
						  subject: 'Connection Alarm '+ element.name,
						  html:'<h1 style="Color:red">Alert!</h1>'+'<p>'+element.text+'</p>'
						 // text: 'Device '+deviceEUI+' Alarm  '+ alarmType +' detail '+ description
						};
			await sendEmail(mailOptions);
			}
						next()
			
		}
		else{
			//await updateAlarmFlag(element.id, false);
			next()
		}
		
		
	}
      
      );
    } else {
      console.log("No Gateways in this Alarm");
    }

    // Process Sensor in this Alarm
    if (element.device && element.device['sensor'].length > 0) {
     // console.log("Sensor: ", element.device['sensor']);
	asyncLoop(element.device['sensor'], async function(item, next) {
		let sensorRes = await getByDeveui(item.deveui);
		let sensorInfo =  await getByDeveuiSensorInfo(item.deveui);
		let alarmNotification  =  await getLastAlarmForSelectedDeviceEui(item.deveui,element.id);
		console.log('sensorRes',sensorRes);
		let alarmAtive = checkTime(sensorRes[0].message_datetime, element.timeToConsiderDeactive);
		//console.log('sensorRes',alarmAtive,sensorRes[0].status);
		if(alarmAtive){
			if( alarmNotification.length > 0){
				console.log('notification already Send for device');
			}
			else{
				console.log('element',element)
			//await updateAlarmFlag(element.id, true);
			//console.log(sensorInfo[0].id, sensorInfo[0].name);
			await insertNotificationForAlarm(element.id,element.user_creator,null,item.deveui,sensorInfo[0].id,'generated',element.description,element.email,element.text,null,sensorInfo[0].name);
		 var mailOptions = {
						  from: 'no-reply@swat-id.gesinen.com',
						  to: element.email,
						  subject: 'Connection Alarm '+ element.name,
						  html:'<h1 style="Color:red">Alert!</h1>'+'<p>'+element.text+'</p>'
						 // text: 'Device '+deviceEUI+' Alarm  '+ alarmType +' detail '+ description
						};
						await sendEmail(mailOptions);
						
			}
			next();
		}
		else{
			//await updateAlarmFlag(element.id, false);
			next()
		}
		
		
	}
      /*element.device['sensor'].forEach(
        async (sensor) => {
          const ping: any = await new Ping(0, sensor.deveui).getByDeveuiOrMac();
          // console.log("LastSeen: ", ping);
          if (sensor.status == StatusIndividual.Ok || sensor.status == StatusIndividual.Notified)
            device.sensor += this.processIfSendEmail(element, ping.message_datetime, sensor);
        }*/
      );
    } else {
      console.log("No Sensors in this Alarm");
    }
  }
 async function getLastAlarmForSelectedGateway(gatewayMac,alarm_id) {
	let gatewayQuery = "SELECT * FROM alarm_notifications WHERE gateway_mac = '"+gatewayMac+"' and alarm_id = '"+alarm_id+"' and created_dt  = (SELECT MAX(alarm_notifications.created_dt) FROM alarm_notifications WHERE alarm_notifications.alarm_id = '"+alarm_id+"' and gateway_mac = '"+gatewayMac+"' and status != 'solved' );";
    let res = await query(gatewayQuery)
    //console.log("res", res)
    return res;
    
}
async function getLastAlarmForSelectedDeviceEui(deviceEUI,alarm_id) {
	let gatewayQuery = "SELECT * FROM alarm_notifications WHERE device_eui = '"+deviceEUI+"' and alarm_id = '"+alarm_id+"' and created_dt  = (SELECT MAX(alarm_notifications.created_dt) FROM alarm_notifications WHERE alarm_notifications.alarm_id = '"+alarm_id+"' and device_eui = '"+deviceEUI+"' and status != 'solved' );";
    let res = await query(gatewayQuery)
    //console.log("res", res)
    return res;
    
} 
  async function getByMac(gatewayMac) {
	let gatewayQuery = "SELECT * FROM gateway_ping WHERE mac_number = '"+gatewayMac+"';";
    let res = await query(gatewayQuery)
    //console.log("res", res)
    return res;
    
}
async function getByMacGatewayInfo(gatewayMac) {
	let gatewayQuery = "SELECT * FROM gateways WHERE mac = '"+gatewayMac+"';";
    let res = await query(gatewayQuery)
    //console.log("res", res)
    return res;
    
}
async function getByDeveui(deviceEUI) {
    let sensorQuery = "SELECT * FROM sensor_ping WHERE device_EUI = '"+deviceEUI+"';";
    let res = await query(sensorQuery)
    //console.log("res", res)
    return res;
    
}
async function getByDeveuiSensorInfo(deviceEUI) {
    let sensorQuery = "SELECT * FROM sensor_info WHERE device_EUI = '"+deviceEUI+"';";
    let res = await query(sensorQuery)
    //console.log("res", res)
    return res;
    
}
async function insertNotificationForAlarm(alarm_id,user_id,gateway_mac,device_eui,sensor_id,status,description,email,email_text,gateway_name,sensor_name) {
    let sensorQuery = "Insert Into alarm_notifications(id,alarm_id,user_id,gateway_mac,device_eui,sensor_id,status,description,email,email_text,gateway_name,sensor_name) value(UUID(),'"+alarm_id+"',"+user_id+",'"+gateway_mac+"','"+device_eui+"',"+sensor_id+",'"+status+"','"+description+"','"+email+"','"+email_text+"','"+gateway_name+"','"+sensor_name+"')";
    console.log(sensorQuery);
	let res = await query(sensorQuery)
    //console.log("res", res)
    return res;
    
}
async function updateAlarmFlag(alarm_id,flag) {
    let alarmQuery = "update alarms set alarm_flag = "+flag+" where id = '"+alarm_id+"';";
    console.log(alarmQuery);
	let res = await query(alarmQuery)
    //console.log("res", res)
    return res;
    
}
async function sendEmail(mailOptions) {
        try {
            console.log(mailOptions)
            let info = await transporter.sendMail(mailOptions);
            console.log('Message sent: %s', info.messageId);
        } catch (error) {
            console.error('Error occurred while sending email. This error should be reported. ', error);
        }
    }

function checkTime(lastSeenDate, timeToConsiderDeactive) {
    if (!timeToConsiderDeactive) return false;
    const lastSeen = new Date(lastSeenDate);
    // Convert to millis
    const [hours, minutes, seconds] = timeToConsiderDeactive.split(":");
    const timeToConsiderDeactiveMs =
      (Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)) * 1000;

    // Obtener la hora actual en milisegundos
    const currentTime = Date.now();

    // Sumar el valor de lastSeen en milisegundos con el valor de element.timeToConsiderDeactive en milisegundos
    const alarmTime = lastSeen.getTime() + timeToConsiderDeactiveMs;
    // Comparar el resultado de la suma con el valor de la hora actual
    if (alarmTime < currentTime) {
      console.log("The alarm should be activated.");
      return true;
    } else {
      console.log("The alarm shouldn't be activated.");
      return false;
    }
  }

/*class AlarmChecker {
  configSmtp;
  schedulerAlarms;

  constructor() {
    this.configSmtp = new configSMTP(
      "smtp.1and1.es",
      465,
      true,
      "alarms@geswat.es",
      "Team@9765"
    );
    this.schedulerAlarms = "*1 * * * *";
    console.log('alarm checker service running');
  }
  // Get the Alarm from DB
  async checkAlarms() {
    const alarms = await this.getAllAlarms();//await new Alarm().getAllForAllUsers();
    alarms.forEach((element) => {
      try {
        this.processAlarm(element);
      } catch (error) {
        console.log("[ERROR]: ", error);
      }
    });
  }
  
  async getAllAlarms() {
    return new Promise(function(resolve, reject) {
        var options = {
            'method': 'GET',
            'url': 'https://stage.swat-id.gesinen.com/v2/service/alarm', //'http://localhost:8080/v2/boiler/devices/service/info',
            'headers': {
                'Content-Type': 'application/json'
            }
	};
        request(options, function(error, response) {
            if (error) throw new Error(error);
            //console.log("getBoilerServiceInfo", response.body);
            let jsonRes = JSON.parse(response.body)
                //console.log("jsonRes", jsonRes)
            resolve(jsonRes.response)
        });
    })
}

  // Process Alarm
  async processAlarm(element) {
    console.log("ELEMENT: ", element);
    element.device = JSON.parse(String(element.device));
    let device ; 
    if (!element.timeToConsiderDeactive) {
      throw new Error("Cant found available timeToConsiderDeactive.");
    }
    // Process Gateways in this Alarm
    if (element.device && element.device.gateway.length > 0) {
      console.log("Gateway: ", element.device.gateway);

      element.device.gateway.forEach(
        async (gateway) => {
          const ping = await new Ping(
            0,
            null,
            gateway.mac_number
          ).getByDeveuiOrMac();
          // console.log("LastSeen: ", ping);
          if (gateway.status == StatusIndividual.Ok || gateway.status == StatusIndividual.Notified)
            device.gateway +=  this.processIfSendEmail(element, ping.message_datetime, gateway);
        }
      );
    } else {
      console.log("No Gateways in this Alarm");
    }

    // Process Sensor in this Alarm
    if (element.device && element.device.gateway.length > 0) {
      console.log("Sensor: ", element.device.sensor);

      element.device.sensor.forEach(
        async (sensor: { deveui: string; status: string }) => {
          const ping: any = await new Ping(0, sensor.deveui).getByDeveuiOrMac();
          // console.log("LastSeen: ", ping);
          if (sensor.status == StatusIndividual.Ok || sensor.status == StatusIndividual.Notified)
            device.sensor += this.processIfSendEmail(element, ping.message_datetime, sensor);
        }
      );
    } else {
      console.log("No Sensors in this Alarm");
    }
  }


// Falta obtener 
  processIfSendEmail(element: Alarm, lastSeen: any, device: any) {
    console.log(lastSeen, element.timeToConsiderDeactive, Date.now());

    // IF Should send email -->
    if (this.checkTime(lastSeen, element.timeToConsiderDeactive)) {

      const client = new EmailSender(this.configSmtp);
      if (element.email) {
        const arrayEmails = element.email.replace("[", "").replace("]", "").split(",");

        console.log(arrayEmails);
        arrayEmails.forEach((email: string) => {
          console.log("Email To send: ", email);
          const msg = new MailOptions(
            "alarmasgeswat@gmail.com",
            email,
            `Alarm ${device.deveui ? ("Sensor: " + device.deveui) : ( "Gateway: " + device.mac_number)}`,
            element.text ? element.text : "Not text Provided",
            ""
          );
          // TODO: Descomentar
          // client.sendEmail(msg);
          device.status = StatusIndividual.Notified
        });
      } else {
        console.log("Not Email Provided");
      }
    } else {
      console.log("Not Alarm All right OK :)");
    }
    return device
  }

  startCronJob() {
    console.log("Schedule CheckAlarms : ", this.schedulerAlarms);
    cron.schedule(this.schedulerAlarms, () => {
      this.checkAlarms();
    });
  }

  checkTime(lastSeenDate: string, timeToConsiderDeactive?: string) {
    if (!timeToConsiderDeactive) return false;
    const lastSeen = new Date(lastSeenDate);
    // Convert to millis
    const [hours, minutes, seconds] = timeToConsiderDeactive.split(":");
    const timeToConsiderDeactiveMs =
      (Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)) * 1000;

    // Obtener la hora actual en milisegundos
    const currentTime = Date.now();

    // Sumar el valor de lastSeen en milisegundos con el valor de element.timeToConsiderDeactive en milisegundos
    const alarmTime = lastSeen.getTime() + timeToConsiderDeactiveMs;
    // Comparar el resultado de la suma con el valor de la hora actual
    if (alarmTime < currentTime) {
      console.log("The alarm should be activated.");
      return true;
    } else {
      console.log("The alarm shouldn't be activated.");
      return false;
    }
  }
}*/


