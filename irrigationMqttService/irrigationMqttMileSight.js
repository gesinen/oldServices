/**
 * Name: MeasureMqttRouter.ts
 * Date: 03 - 03 - 2023
 * Author: Shesh Kumar Singh
 * Description: Manages the MQTT interactions of the irrigation feature
 */

function calculateHexSensorValue(fourBytes) {
    let splitValues = fourBytes.split(",")
    if (splitValues[0].substring(0, 2) == "0x") {
        splitValues[0] = splitValues[0].substring(2, 4)
    }
    if (splitValues[1].substring(0, 2) == "0x") {
        splitValues[1] = splitValues[1].substring(2, 4)
    }
    let val = hexToIntStr(splitValues[1] + splitValues[0])
    let res = val.substring(0, val.length - 1) + "." + val.substring(val.length - 1, val.length)
    return res
}

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

const mysql = require('mysql');

// Database
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Al8987154St12',
    //password: '',
    database: 'swat_gesinen'
});

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

function hexToIntStr(hexString) {
    return parseInt(hexString, 16).toString();
}

async function main() {
    let querySql = `SELECT irrigation_device.id as irrigation_device_id, gateways.mac as device_gateway, sensor_info.device_EUI as irrigation_deviceEUI FROM irrigation_device INNER JOIN sensor_info ON sensor_info.id=irrigation_device.sensorId INNER JOIN gateways ON gateways.sensors_id LIKE CONCAT('%',irrigation_device.sensorId,'%');`
	

    let storedData = []
    let deviceEUI_fk_irrigationDevEUI = []
    query(querySql).then(rows => {


        rows.forEach(element => {
            storedData.push({
                device_gateway: element.device_gateway,
                irrigation_deviceEUI: element.irrigation_deviceEUI
            })
            deviceEUI_fk_irrigationDevEUI[element.irrigation_deviceEUI] = element.irrigation_device_id
        });
        //conn.release();
        const client = mqtt.connect('mqtts://gesinen.es:8882', options)

        client.on('connect', function() {
            console.log('Connected')
            console.log("storedData", storedData)
            console.log("deviceEUI_fk_irrigationDevEUI", deviceEUI_fk_irrigationDevEUI)
                // Reset handler topic
            client.subscribe('irrigation/service/reset', function(err) {
                if (!err) {
                    console.log("subscrito a Reset handler topic => irrigation/service/reset")
                } else {
                    console.log(err)
                }
            })
            storedData.forEach(element => {
                // Me subscribo a todos los gateways
                client.subscribe(element.device_gateway + '/application/2/device/#', function(err) {
				//	client.subscribe('b827eb805934/application/2/device/#', function(err) {
                    if (!err) {
                        console.log("subscrito a " + element.device_gateway+'/application/2/device/#')
                    } else {
                        console.log(err)
                    }
                })
				client.subscribe(element.device_gateway + '/application/4/device/#', function(err) {
				//	client.subscribe('b827eb805934/application/2/device/#', function(err) {
                    if (!err) {
                        console.log("subscrito a " + element.device_gateway+'/application/2/device/#')
                    } else {
                        console.log(err)
                    }
                })

            });
        })
        client.on('disconnect', function(err) {
            console.log("disconnect", err);
        })

        client.on('error', function(err) {
            console.log("error", err);
        })

        client.on('message', async function(topic, message) {
            console.log("topic", topic)

            if (topic != undefined && topic == "irrigation/service/reset") {
                console.log("// reseting service... //")
                client.end()
                main()
            } else {
               // console.log("message", JSON.parse(message.toString()))
                let messageJSON = JSON.parse(message.toString())
                    // MODELO SENSOR TEMPERATURA MODBUS
                if (topic != undefined && messageJSON.object != undefined && messageJSON.object.DecodeDataHex != undefined) {
                    if (messageJSON.object.DecodeDataHex.substring(0, 9) == "0x64,0x64" && messageJSON.object.DecodeDataHex.split(",").length > 5) {
                        //console.log("message", messageJSON)
                        let cabecera = messageJSON.object.DecodeDataHex.substring(0, 9)
                        console.log("cabecera", cabecera)
                            // Le sumo uno porque en firmware comienzan en el sensor 0 y en la plataforma ese es el 1
                        let inputIndex = parseInt(hexToIntStr(messageJSON.object.DecodeDataHex.substring(10, 14))) + 1
                        console.log("inputIndex", inputIndex)
                        let temperatura = calculateHexSensorValue(messageJSON.object.DecodeDataHex.substring(15, 34))
                        console.log("temperatura", temperatura)
                        let humedad = calculateHexSensorValue(messageJSON.object.DecodeDataHex.substring(35, 54))
                        console.log("humedad", humedad)
                        let topicSplit = topic.split("/")
                        let irrigationDeviceId = deviceEUI_fk_irrigationDevEUI[topicSplit[4]]
                            // Obtengo el irrigation_device_input.id del sensor de suelo dado el sensorIndex y el irrigationDeviceId
                        let queryGetIrrigationInputId = "SELECT id FROM irrigation_device_input WHERE irrigationDeviceId=" + irrigationDeviceId + " AND sensorIndex=" + inputIndex
                        console.log("selectQuery", queryGetIrrigationInputId)
                        let date = new Date(Date.now())
                        date.setHours(date.getHours() + 2);
                        // DATE_TIME FORMAT
                        let dateStr = date.toISOString().split("T")[0] + " " + date.toISOString().split("T")[1].substring(0, 8)
                        query(queryGetIrrigationInputId).then(rows => {
                            //console.log("rows", rows)
                            let irrigationInputDeviceId = rows[0].id
                                // Falta configurar la hora del servidor
                            let queryAddSensorValues = "INSERT INTO irrigation_device_input_history (`irrigationDeviceInputId`, `humidity`, `temperature`, `timestamp`)" +
                                " VALUES (" + irrigationInputDeviceId + "," + humedad + "," + temperatura + ",'" + dateStr + "');"
                            console.log("queryAddSensorValues", queryAddSensorValues)

                            query(queryAddSensorValues).then(rowsAdd => {
                                console.log(rowsAdd)
                            })
                        })
                        if (humedad >= 85) {
                            let gatewayMac = topicSplit[0]
                            let deviceEui = topicSplit[4]
                            //deactivateAllValves(deviceEui, gatewayMac, client)
                        }
                        // MODELO SENSOR TEMPERATURA LORA
                    } else if (messageJSON.object.DecodeDataHex.substring(0, 4).toLowerCase() == "0xc0") {
                        let topicSplit = topic.split("/")
                        let gatewayMac = topicSplit[0]
                        let relatedSensorDeviceEui = topicSplit[4]
                        let splitMsg = messageJSON.object.DecodeDataHex.split(",")
                        let bytesHumedad = [splitMsg[1], splitMsg[2], splitMsg[3], splitMsg[4]]
                        let bytesTemperatura = [splitMsg[6], splitMsg[7], splitMsg[8], splitMsg[9]]
                        let humedad = getHexValueLoraMsg(bytesHumedad)
                        let temperatura = getHexValueLoraMsg(bytesTemperatura)
                        console.log("humedad", humedad)
                        console.log("temperatura", temperatura)
                        if (humedad > 100) {
                            humedad = 100
                            console.log("HUMEDAD > 100", humedad)
                        }
                       // let queryGetIrrigationDevices = "SELECT * FROM `irrigation_device` WHERE" +
                        //    " parametersSensorDevEui='" + relatedSensorDeviceEui + "';"
						let queryGetIrrigationDevices = "SELECT irrigation_device.id , irrigation_device.deviceTypeId,irrigation_device_output.sensorId as humitytempId  FROM `sensor_info` LEFT JOIN irrigation_device ON sensor_info.id = irrigation_device.sensorId LEFT JOIN irrigation_device_output ON sensor_info.id = irrigation_device_output.sensorId WHERE device_EUI='" + relatedSensorDeviceEui + "';"
                        console.log('porque no está funcionando esto',queryGetIrrigationDevices);
                        query(queryGetIrrigationDevices).then(async function(rows) {
                                console.log("getDeviceEuiBySensorId RES", rows)
                                for (const row of rows) {
									
									console.log('splitMSG',splitMsg);
									if(row.humitytempId != null){
									let insertTempAndHumity = await insertLoraHistoryRecord(row.humitytempId,humedad,temperatura);
								console.log('insertTempAndHumity',insertTempAndHumity);}
								
                                    /*let irrigationDevice = await getDeviceBySensorId(row.sensorId)
                                    let irrigationDeviceId = row.id
                                    let irrigationDeviceDeviceEUI = irrigationDevice.device_EUI
                                    let deviceTypeId = row.deviceTypeId;
                                    let storeRecordRes = await insertLoraHistoryRecord(irrigationDeviceId, humedad, temperatura)
                                    if (humedad >= parseInt(row.humidityLimit)) {
                                        console.log("HUMEDAD > 85")
                                       // deactivateAllValves(irrigationDeviceDeviceEUI, gatewayMac, client, deviceTypeId)
                                    } else if (humedad <= parseInt(row.humidityLimitInferior)){
                                        activateAllValves(irrigationDeviceDeviceEUI, gatewayMac, client, deviceTypeId);
                                    }*/
                                }
                        })
                            //200 79 129 66
                    }
					else if (messageJSON.object.DecodeDataHex.substring(0, 4).toLowerCase() == "0x15"){
						let topicSplit = topic.split("/")
						let irrigationDeviceId = deviceEUI_fk_irrigationDevEUI[topicSplit[4]];
						let valveStatus = 0;
						let deviceEui = messageJSON.devEUI;
						let valveNumber = messageJSON.object.DecodeDataHex.substring(5, 9).toLowerCase();
						console.log(valveNumber,messageJSON.object.DecodeDataHex.substring(10, 14).toLowerCase());
						valveStatus = messageJSON.object.DecodeDataHex.substring(10, 14).toLowerCase() == "0x00" ? 0:1;
						console.log(irrigationDeviceId,valveNumber,messageJSON.object.DecodeDataHex.substring(10, 14).toLowerCase(),valveStatus);
						if(valveNumber ==  "0x00" ){
							// valve 0
						
							let updateRecordRes = await UpdateTheVolveStatus(irrigationDeviceId, 1, valveStatus);
							console.log('updateRecordRes',updateRecordRes);
							await InsertTheVolveStatusOnOffHistory(irrigationDeviceId, deviceEui,1, valveStatus);
						}
						if(valveNumber ==  "0x01"  ){
							// valve 1
							let updateRecordRes = await UpdateTheVolveStatus(irrigationDeviceId, 2, valveStatus);
							console.log('updateRecordRes',updateRecordRes);
							await InsertTheVolveStatusOnOffHistory(irrigationDeviceId, deviceEui,2, valveStatus);
						}
						if(valveNumber ==  "0x02"  ){
							// valve 2
							let updateRecordRes = await UpdateTheVolveStatus(irrigationDeviceId, 3, valveStatus);
							console.log('updateRecordRes',updateRecordRes);
							await InsertTheVolveStatusOnOffHistory(irrigationDeviceId, deviceEui,3, valveStatus);
						}
						if(valveNumber ==  "0x04"  ){
							// valve 4
							let updateRecordRes = await UpdateTheVolveStatus(irrigationDeviceId, 4, valveStatus);
							console.log('updateRecordRes',updateRecordRes);
							await InsertTheVolveStatusOnOffHistory(irrigationDeviceId, deviceEui,4, valveStatus);
						}
						
					}
					else if(messageJSON.fPort == 85){
						let topicSplit = topic.split("/")
                        let gatewayMac = topicSplit[0]
                        let relatedSensorDeviceEui = topicSplit[4]
						let bytesVolveStatus = 0;
						let batteryLevel      = 0;
						let splitMsg = messageJSON.object.DecodeDataHex.split(",");
						
                        let bytesTemperatura = [splitMsg[5], splitMsg[6]]
                        //let humedad = getHexValueMileSight(bytesHumedad)
                        //let temperatura = getHexValueMileSight(bytesTemperatura)
                        //console.log("humedad", humedad)
                        //console.log("temperatura", temperatura)
						
						//let queryGetIrrigationDevices = "SELECT * FROM `irrigation_device` WHERE parametersSensorDevEui='" + relatedSensorDeviceEui + "';"
						let queryGetIrrigationDevices = "SELECT irrigation_device.id , irrigation_device.deviceTypeId,irrigation_device_output.sensorId as humitytempId  FROM `sensor_info` LEFT JOIN irrigation_device ON sensor_info.id = irrigation_device.sensorId LEFT JOIN irrigation_device_output ON sensor_info.id = irrigation_device_output.sensorId WHERE device_EUI='" + relatedSensorDeviceEui + "';"
                        console.log('porque no está funcionando esto');
                        query(queryGetIrrigationDevices).then(async function(rows) {
							//console.log("getDeviceEuiBySensorId RES", rows);
							for (const row of rows) {
								let irrigationDeviceId = row.id
								let humitytempId = row.humitytempId
								
								if(row.deviceTypeId == 5){
									
									let decoderControllerRes	= DecoderController(splitMsg,85);
									console.log('decoderControllerRes',decoderControllerRes);
									if (messageJSON.object.DecodeDataHex.substring(0, 9) == "0xfe,0x4c"){
										 let decodedRes = DecoderSchedulePlanOfMilesight(messageJSON.data,85);
										 let valveConfig = JSON.stringify(decodedRes);
										let insertInScheduleOfDevice = await insertorUpdateInScheduleOfDeviceinDB(irrigationDeviceId,decodedRes.slotNumber,relatedSensorDeviceEui, gatewayMac,valveConfig); 
										
									}
						
									if(decoderControllerRes.valve1 ==  1 ){
										let updateRecordRes = await UpdateTheVolveStatus(irrigationDeviceId, 1, decoderControllerRes.valve1Status);
										console.log('updateRecordRes',updateRecordRes);
										await InsertTheVolveStatusOnOffHistory(irrigationDeviceId, relatedSensorDeviceEui,1, decoderControllerRes.valve1Status);
									}
									if(decoderControllerRes.valve2 ==  2 ){
										let updateRecordRes = await UpdateTheVolveStatus(irrigationDeviceId, 2, decoderControllerRes.valve2Status);
										console.log('updateRecordRes',updateRecordRes);
										await InsertTheVolveStatusOnOffHistory(irrigationDeviceId, relatedSensorDeviceEui,2, decoderControllerRes.valve1Status);
									}
									if(decoderControllerRes.batteryStatus ==  true ){
										let updateRecordRes = await UpdateTheBateryLevel(irrigationDeviceId,decoderControllerRes.battery);
									}							 
								}
								else{
									console.log('splitMSG',splitMsg);
									let decoderResponse = DecoderOfTempAndHumidity(splitMsg,85);
									
									console.log('decoderResponse',decoderResponse);
									let insertTempAndHumity = await insertLoraHistoryRecord(humitytempId,decoderResponse.humidity,decoderResponse.temperature);
									console.log('insertTempAndHumity',insertTempAndHumity);
								}
						
							}
						
						});
					}
                }
            }
        })
    })
}

async function insertorUpdateInScheduleOfDeviceinDB(irrigationDeviceId,slotNumber,irrigationDeviceEUI, irrigationGatewayMac,valveConfig){
	return new Promise((resolve, reject) => {
		let selectQuery = "SELECT * FROM irrigation_device_ouput_config_from_device where irrigationDeviceId = "+ irrigationDeviceId+ " AND slotNumber = "+slotNumber;
        console.log("QUERY => " + selectQuery);
		let myquery = "";
        query(selectQuery).then(rows => {
           if(rows.length  > 0){
			    myquery = "Update irrigation_device_ouput_config_from_device set valveConfigfromDevice ='"+ valveConfig +"' where id = "+ rows[0].id;
		   }
		   else{
			   myquery = "Insert Into irrigation_device_ouput_config_from_device(irrigationDeviceId,irrigationDeviceEUI,irrigationGatewayMac,valveConfigfromDevice,slotNumber) Values("+irrigationDeviceId+",'"+irrigationDeviceEUI+"','"+irrigationGatewayMac+"','"+valveConfig+"',"+slotNumber+");"
		   }
		   query(myquery).then(rows => {
		   resolve(rows);
		   })
        })
		
	})
	
}

async function insertLoraHistoryRecord(irrigationDeviceId, humedad, temperatura) {
    return new Promise((resolve, reject) => {
        let date = new Date(Date.now())
        date.setHours(date.getHours() + 2);
        // DATE_TIME FORMAT
        let dateStr = date.toISOString().split("T")[0] + " " + date.toISOString().split("T")[1].substring(0, 8)
        let queryAddSensorValuesLora = "INSERT INTO irrigation_device_input_history_lora (`irrigationDeviceId`, `humidity`, `temperature`, `timestamp`)" +
            " VALUES (" + irrigationDeviceId + "," + humedad + "," + temperatura + ",'" + dateStr + "');"
        console.log("POST RECORD QUERY => " + queryAddSensorValuesLora)
        query(queryAddSensorValuesLora).then(rows => {
           // console.log("insertLoraHistoryRecord RES", rows)
            resolve(rows)
        })
    })
}

async function UpdateTheVolveStatus(irrigationDeviceId, volveId, Volvestatus) {
    return new Promise((resolve, reject) => {
        let date = new Date(Date.now())
        date.setHours(date.getHours() + 2);
        // DATE_TIME FORMAT
        let dateStr = date.toISOString().split("T")[0] + " " + date.toISOString().split("T")[1].substring(0, 8)
        let queryUpdateVolveStatus = "update  irrigation_device_output set status = " +
            + Volvestatus+ " where  irrigationDeviceId = "+ irrigationDeviceId + " and sensorIndex ="+volveId;
        //console.log("POST RECORD QUERY => " + queryUpdateVolveStatus)
        query(queryUpdateVolveStatus).then(rows => {
           // console.log("queryUpdateVolveStatus RES", rows)
            resolve(rows)
        })
    })
}
async function InsertTheVolveStatusOnOffHistory(irrigationDeviceId, valvesensordeviceEui,volveId, Volvestatus) {
    return new Promise((resolve, reject) => {
        let date = new Date(Date.now())
        date.setHours(date.getHours() + 2);
        // DATE_TIME FORMAT
        let dateStr = date.toISOString().split("T")[0] + " " + date.toISOString().split("T")[1].substring(0, 8)
        
        //console.log("POST RECORD QUERY => " + queryUpdateVolveStatus)
		let querytoAddOnOffHistory = "INSERT INTO irrigation_valve_onoff_history (`irrigationDeviceId`, `valveSensorDeviceEui`, `valveNumber`, `valveStatus`, `timestamp`)" +
            " VALUES (" + irrigationDeviceId + ",'"+valvesensordeviceEui+"'," + volveId + "," + Volvestatus + ",'" + dateStr + "');"
        query(querytoAddOnOffHistory).then(rows => {
           // console.log("queryUpdateVolveStatus RES", rows)
            resolve(rows)
        })
    })
}
async function UpdateTheBateryLevel(irrigationDeviceId, batteryLevel) {
    return new Promise((resolve, reject) => {
        let date = new Date(Date.now())
        date.setHours(date.getHours() + 2);
        // DATE_TIME FORMAT
        let dateStr = date.toISOString().split("T")[0] + " " + date.toISOString().split("T")[1].substring(0, 8)
        let queryUpdateBatteryLevel = "update  irrigation_device set batteryLevele = " +
            + Volvestatus+ " where  id = "+ irrigationDeviceId;
        //console.log("POST RECORD QUERY => " + queryUpdateBatteryLevel)
        query(queryUpdateBatteryLevel).then(rows => {
          //  console.log("queryUpdateBatteryLevel RES", rows)
            resolve(rows)
        })
    })
}

//Milesight EM-500
function DecoderOfTempAndHumidity(bytes, port) {
	//debugger;
    var decoded = {};
	console.log('bytes',bytes,port);

    for (var i = 0; i < bytes.length;) {
        var channel_id = bytes[i++];
        var channel_type = bytes[i++];
        // BATTERY
        if (channel_id === "0x01" && channel_type === "0x75") {
			hexbytes = bytes.slice(i);
			let hex =  hexbytes[0].substring(2,4);
			console.log(hex);
			 decoded.battery = parseInt(hex,16);
            //decoded.battery = bytes[i];
            i += 1;
			console.log('battery',decoded.battery);
        }
        // TEMPERATURE
        else if (channel_id === "0x03" && channel_type === "0x67") {
            // ℃
			 hexbytes = bytes.slice(i, i + 2);
			 let hex0 = hexbytes[0].substring(2,4);
			 let hex1 = hexbytes[1].substring(2,4);
			 if(hex1 == 'ff'){
				let hex =  hexbytes[0].substring(2,4);
				console.log(hex);
			 decoded.temperature = parseInt(hex,16)/10;
			 }
			 else{
				 let hex =  hexbytes[1].substring(2,4)+hexbytes[0].substring(2,4);
			 console.log(hex);
			 decoded.temperature = parseInt(hex,16)/10;
			 }
			
            //decoded.temperature = readInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
			console.log('temp',decoded.temperature);
            // ℉
            // decoded.temperature = readInt16LE(bytes.slice(i, i + 2)) / 10 * 1.8 + 32;
            // i +=2;
        }
        // HUMIDITY
        //old resolution 0.5
        else if (channel_id === "0x04" && channel_type === "0x68") {
			hexbytes = bytes.slice(i);
			let hex =  hexbytes[0].substring(2,4);
			 console.log(hex);
			 decoded.humidity = parseInt(hex,16)/2;
            //decoded.humidity = bytes[i] / 2;
            i += 1;
			console.log('humidity',decoded.humidity);
        }
        //new resolution 0.01
        else if (channel_id === "0x04" && channel_type === "0xca") {
			hexbytes = bytes.slice(i, i + 2);
			let hex0 = hexbytes[0].substring(2,4);
			let hex1 = hexbytes[1].substring(2,4);
			if(hex1 == 'ff'){
				let hex =  hexbytes[0].substring(2,4)
				console.log(hex);
			 decoded.humidity = parseInt(hex,16)/2;
			}
			else{
				let hex =  hexbytes[0].substring(2,4)+hexbytes[1].substring(2,4);
			 console.log(hex);
			 decoded.humidity = parseInt(hex,16)/2;
			}
			
            //decoded.humidity = readUInt16LE(bytes.slice(i, i + 2)) / 100;
            i += 2;
			console.log('humidity',decoded.humidity);
        }
        // EC
        else if (channel_id === "0x05" && channel_type === "0x7f") {
			hexbytes = bytes.slice(i, i + 2);
			let hex =  hexbytes[1].substring(2,4)+hexbytes[0].substring(2,4);
			 console.log(hex);
			 decoded.ec = parseInt(hex,16);
            //decoded.ec = readUInt16LE(bytes.slice(i, i + 2));
            i += 2;
			console.log('ec',decoded.ec);
        } else {
            break;
        }
    }

    return decoded;
}

function readUInt16LE(bytes) {
	debugger
    var value = (bytes[1] << 8) + bytes[0];
    return value & 0xffff;
}

function readInt16LE(bytes) {
    var ref = readUInt16LE(bytes);
    return ref > 0x7fff ? ref - 0x10000 : ref;
}
//console.log(Decoder(["0x01","0x75","0x64","0x03","0x67","0x19","0x01","0x04","0x68","0x73","0x05","0x7f","0xf0","0x00"]));

//milesight UC-511
function DecoderController(bytes, port) {
    var decoded = {};

    for (var i = 0; i < bytes.length;) {
        var channel_id = bytes[i++];
        var channel_type = bytes[i++];

        // BATTERY
        if (channel_id === "0x01" && channel_type === "0x75") {
			hexbytes = bytes[i];
			let hex =  hexbytes.substring(2,4);
			 console.log(hex);
			 decoded.batteryStatus = true;
            decoded.battery =  parseInt(hex,16);
            i += 1;
        }
        // VALVE 1
        else if (channel_id === "0x03" && channel_type == "0x01") {
			
			hexbytes = bytes[i];
			let hex =  hexbytes.substring(2,4);
			 console.log('Hex',hexbytes,hex,parseInt(hex,16));
			 decoded.valve1 =  1;
            decoded.valve1Status = parseInt(hex,16) === 0 ? 0 : 1;
            i += 1;
        }
        // VALVE 2
        else if (channel_id === "0x05" && channel_type == "0x01") {
			hexbytes = bytes[i];
			let hex =  hexbytes.substring(2,4);
			console.log('Hex',hexbytes,hex,parseInt(hex,16));
			decoded.valve2 =  2;
            decoded.valve2Status = parseInt(hex,16) === 0 ? 0 : 1;
            i += 1;
        }
        // VALVE 1 Pulse
        else if (channel_id === "0x04" && channel_type === "0xc8") {
            //decoded.valve1_pulse = readUInt32LE(bytes.slice(i, i + 4));
            i += 4;
        }
        // VALVE 2 Pulse
        else if (channel_id === "0x06" && channel_type === "0xc8") {
            //decoded.valve2_pulse = readUInt32LE(bytes.slice(i, i + 4));
            i += 4;
        }
        // GPIO 1
        else if (channel_id === "0x07" && channel_type == "0x01") {
            //decoded.gpio_1 = bytes[i] === 0 ? "off" : "on";
            i += 1;
        }
        // GPIO 2
        else if (channel_id === "0x08" && channel_type == "0x01") {
            //decoded.gpio_2 = bytes[i] === 0 ? "off" : "on";
            i += 1;
        } else {
            break;
        }
    }

    return decoded;
}
function base64ToDecimal(encodedString) {
	let decimalArray =[];
    var   buf = Buffer.from(encodedString, 'base64');	
			for(var j=0;j<buf.length;j++){
				
				//console.log(buf[j]);
				var messageVal = buf[j].toString(16);//parseInt(buf[j],16);			
					
				var messageValdecimal = buf[j].toString(10);
				decimalArray.push(messageValdecimal);					
			}

    // Join all decimals to get the final decimal for the entire string
    return decimalArray;
}
function dec2bin(num) {
	console.log(num);
    return (Number(num).toString(2)).padStart(8, '0');
}
//decode the schedule of plans
function DecoderSchedulePlanOfMilesight(encodedString, port) {
    var decoded = {};
		 let decimalNumbers = base64ToDecimal(encodedString);
			let slotNumber = Number(decimalNumbers[2]).toString(16);
			/*if(decimalNumbers[3] == 0 && decimalNumbers[4] == 0 && decimalNumbers[5] == 0 && decimalNumbers[6] == 0 && decimalNumbers[7] == 0 && decimalNumbers[8] == 0 && decimalNumbers[9] == 0 ){
				insertRecord = false;
			}*/
			let ControlField = ((dec2bin(decimalNumbers[3])).split(''));//.reverse();
			console.log('controlfield',ControlField);
			let days = ((dec2bin(decimalNumbers[4])).split(''));//.reverse();
			console.log('days',days);
			let daysName =[];
				days.forEach((val,index)=>{
					let day;
					switch(index){
						case 0:
							day  = val == '1'?'Monday':''
							daysName.push(day)
							break;
						case 1:
							day  = val == '1'?'Tuesday':''
							daysName.push(day)
							break;
						case 2:
							day  = val == '1'?'Wednesday':''
							daysName.push(day)
							break;
						case 3:
							day  = val == '1'?'Thursday':''
							daysName.push(day)
							break;
						case 4:
							day  = val == '1'?'Friday':''
							daysName.push(day)
							break;
						case 5:
							day  = val == '1'?'Saturday':''
							daysName.push(day)
							break;
						case 6:
							day  = val == '1'?'Sunday':''
							daysName.push(day)
							break;
					}
				})
			let startTime =  ('0'+decimalNumbers[5]).slice(-2)+':'+ ('0'+decimalNumbers[6]).slice(-2);
			let endTime =  ('0'+decimalNumbers[7]).slice(-2) +':'+ ('0'+decimalNumbers[8]).slice(-2);
			let pulse = decimalNumbers[9]+decimalNumbers[10];
			decoded.slotNumber = slotNumber;
			decoded.ControlFieldenable = ControlField[0];
			decoded.ControlFieldopen = ControlField[1];
			decoded.ControlFieldvalve1 = ControlField[6];
			decoded.ControlFieldvalve2 = ControlField[7];
			decoded.days = daysName;
			decoded.startTime = startTime;
			decoded.endTime = endTime;
			decoded.pulse = pulse;
		
			console.log('decode',decoded);

    return decoded;
}

async function getDeviceBySensorId(sensorId) {
    return new Promise((resolve, reject) => {
        query("SELECT id,device_EUI FROM `sensor_info` WHERE id=" + sensorId).then(rows => {
            console.log("getDeviceEuiBySensorId RES", rows)
            resolve(rows[0])
        })
    })
}

function getHexValueLoraMsg(dataArray) {
    var data = new Uint8Array(4);
    data[0] = dataArray[0];
    data[1] = dataArray[1];
    data[2] = dataArray[2];
    data[3] = dataArray[3];

    var f32 = new Float32Array(data.buffer);
    var f32value = f32[0];
    return f32value
}



main()