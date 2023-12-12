/**
 * Name: MeasureMqttRouter.ts
 * Date: 01 - 04 - 2021
 * Author: Daniel Poquet Ramirez
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

function deactivateAllValves(deviceEUI, mac, mqttClient, deviceTypeId) {
    for (let index = 1; index <= 8; index++) {
        deactivateValve(index, deviceEUI, mac, mqttClient, deviceTypeId)
    }
}

function activateAllValves(deviceEUI, mac, mqttClient, deviceTypeId) {
    for (let index = 1; index <= 8; index++) {
        activateValve(index, deviceEUI, mac, mqttClient, deviceTypeId)
    }
}

function activateValve(index, deviceEUI, mac, mqttClient, deviceTypeId) {

    const applicationId = 2;
    const num = index - 1;
    let send = '';
    let fPort;
    if (deviceTypeId < 3) {
        fPort = 10;
        switch (num) {
            case 0:
                send = "Z2QAAQE=";
                break;
            case 1:
                send = "Z2QBAQE=";
                break;
            case 2:
                send = "Z2QEAQE=";
                break;
            case 3:
                send = "Z2QFAQE=";
                break;
            case 4:
                send = "Z2QGAQE=";
                break;
            case 5:
                send = "Z2QHAQE=";
                break;
            case 6:
                send = "Z2QIAQE=";
                break;
            case 7:
                send = "Z2QJAQE=";
                break;
            default:
                break;
        }
    } else if (deviceTypeId === 3) {
        fPort = 4;
        switch (num) {
            case 0:
                send = "DRAADw8=";
                break;
            case 1:
                send = "DRABDw8=";
                break;
            case 2:
                send = "DRACDw8=";
                break;
            case 3:
                send = "DRADDw8=";
                break;
            case 4:
                send = "DRAEDw8=";
                break;
            default:
                break;
        }
    } else {
        fPort = 4;
        switch (num) {
            case 0:
                send = "0QD/";
                break;
            case 1:
                send = "0QH/";
                break;
            case 2:
                send = "0QL/";
                break;
            case 3:
                send = "0QT/";
                break;
            default:
                break;
        }
    }

    //const topic = "dca632143f21/application/2/device/0079e129d52aa017/tx";
    const topic = mac + "/application/" + applicationId + "/device/" + deviceEUI + "/tx";

    let msg = {
        confirmed: true,
        fPort: fPort,
        data: send
    }
    console.log("topic", topic)
    console.log("msg", JSON.stringify(msg))
    mqttClient.publish(topic, JSON.stringify(msg))

}

function deactivateValve(index, deviceEUI, mac, mqttClient, deviceTypeId) {

    const applicationId = 2;
    const num = index - 1;
    let send = '';
    let fPort;
    if (deviceTypeId < 3) {
        fPort = 10;
        switch (num) {
            case 0:
                send = "Z2QAAAA=";
                break;
            case 1:
                send = "Z2QBAAA=";
                break;
            case 2:
                send = "Z2QEAAA=";
                break;
            case 3:
                send = "Z2QFAAA=";
                break;
            case 4:
                send = "Z2QGAAA=";
                break;
            case 5:
                send = "Z2QHAAA=";
                break;
            case 6:
                send = "Z2QIAAA=";
                break;
            case 7:
                send = "Z2QJAAA=";
                break;
            default:
                break;
        }
    } else if (deviceTypeId === 3) {
        fPort = 4;
        switch (num) {
            case 0:
                send = "DRAAAAA=";
                break;
            case 1:
                send = "DRABAAA=";
                break;
            case 2:
                send = "DRACAAA=";
                break;
            case 3:
                send = "DRADAAA=";
                break;
            case 4:
                send = "DRAEAAA=";
                break;
            default:
                break;
        }

    } else {
        fPort = 4;
        switch (num) {
            case 0:
                send = "0QAA";
                break;
            case 1:
                send = "0QEA";
                break;
            case 2:
                send = "0QIA";
                break;
            case 3:
                send = "0QQA";
                break;
            default:
                break;
        }
    }

    //const topic = "dca632143f21/application/2/device/0079e129d52aa017/tx";
    const topic = mac + "/application/" + applicationId + "/device/" + deviceEUI + "/tx";

    let msg = {
        confirmed: true,
        fPort: fPort,
        data: send
    }
    console.log("topic", topic)
    console.log("msg", msg)
    mqttClient.publish(topic, JSON.stringify(msg))

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
                    if (!err) {
                        console.log("subscrito a " + element.device_gateway + '/application/2/device/#')
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
                console.log("message", JSON.parse(message.toString()))
                let messageJSON = JSON.parse(message.toString())
                    // MODELO SENSOR TEMPERATURA MODBUS
                if (topic != undefined && messageJSON.object != undefined && messageJSON.object.DecodeDataHex != undefined) {
                    if (messageJSON.object.DecodeDataHex.substring(0, 9) == "0x64,0x64" && messageJSON.object.DecodeDataHex.split(",").length > 5) {
                        console.log("message", messageJSON)
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
                            console.log("rows", rows)
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
                            deactivateAllValves(deviceEui, gatewayMac, client)
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
                        let queryGetIrrigationDevices = "SELECT * FROM `irrigation_device` WHERE" +
                            " parametersSensorDevEui='" + relatedSensorDeviceEui + "';"
                        console.log('porque no está funcionando esto');
                        query(queryGetIrrigationDevices).then(async function(rows) {
                                console.log("getDeviceEuiBySensorId RES", rows)
                                for (const row of rows) {
                                    let irrigationDevice = await getDeviceBySensorId(row.sensorId)
                                    let irrigationDeviceId = row.id
                                    let irrigationDeviceDeviceEUI = irrigationDevice.device_EUI
                                    let deviceTypeId = row.deviceTypeId;
                                    let storeRecordRes = await insertLoraHistoryRecord(irrigationDeviceId, humedad, temperatura)
                                    if (humedad >= parseInt(row.humidityLimit)) {
                                        console.log("HUMEDAD > 85")
                                        deactivateAllValves(irrigationDeviceDeviceEUI, gatewayMac, client, deviceTypeId)
                                    } else if (humedad <= parseInt(row.humidityLimitInferior)){
                                        activateAllValves(irrigationDeviceDeviceEUI, gatewayMac, client, deviceTypeId);
                                    }
                                }
                        })
                            //200 79 129 66
                    }
					else if(messageJSON.object.DecodeDataHex.substring(0, 4).toLowerCase() == "0x03"){
						let topicSplit = topic.split("/")
                        let gatewayMac = topicSplit[0]
                        let relatedSensorDeviceEui = topicSplit[4]
						
						let splitMsg = messageJSON.object.DecodeDataHex.split(",")
                        let bytesVolveStatus = 	hexToIntStr(splitMsg[2]);
						let VolveId = 	hexToIntStr(splitMsg[1]);
                       console.log('bytesVolveStatus',bytesVolveStatus,VolveId)
                        
						let queryGetIrrigationDevices = "SELECT * FROM `irrigation_device` WHERE parametersSensorDevEui='" + relatedSensorDeviceEui + "';"
                        console.log('porque no está funcionando esto');
                        query(queryGetIrrigationDevices).then(async function(rows) {
							console.log("getDeviceEuiBySensorId RES", rows);
							for (const row of rows) {
								let irrigationDeviceId = row.id
								
                                
						let updateRecordRes = await UpdateTheVolveStatus(irrigationDeviceId, VolveId, bytesVolveStatus);
						console.log('updateRecordRes',updateRecordRes);
							}
						});
					}
                }
            }
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
            console.log("insertLoraHistoryRecord RES", rows)
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
        console.log("POST RECORD QUERY => " + queryUpdateVolveStatus)
        query(queryUpdateVolveStatus).then(rows => {
            console.log("queryUpdateVolveStatus RES", rows)
            resolve(rows)
        })
    })
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
