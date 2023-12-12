// Decodificacion de datos V2 (Todo en un mensaje)
function decodeBoilerPing(decodeDataHexRaw) {
    var decodeDataHex = decodeDataHexRaw.split(",");
    var bytesDistanciaUltrasonidos = decodeDataHex[5].substring(2, 4) + decodeDataHex[4].substring(2, 4);
    var bytesTemperatura = decodeDataHex[9].substring(2, 4) + decodeDataHex[8].substring(2, 4);
    var byteEstadoRele = decodeDataHex[13].substring(2, 4);
    var byteHoraEncendido = decodeDataHex[16].substring(2, 4);
    var byteMinutoEncendido = decodeDataHex[17].substring(2, 4);
    var byteHoraApagado = decodeDataHex[18].substring(2, 4);
    var byteMinutoApagado = decodeDataHex[19].substring(2, 4);
    var byteModoScheduler = decodeDataHex[20].substring(2, 4);
    // Si esta en modo manual no modifico el horario
    if (!parseStateHex(byteModoScheduler)) {
        return {
            distance: parseDistanceHex(bytesDistanciaUltrasonidos),
            temperature: parseTemperatureHex(bytesTemperatura),
            relayState: parseStateHex(byteEstadoRele),
            schedulerMode: parseStateHex(byteModoScheduler)
        }
    } else {
        return {
            distance: parseDistanceHex(bytesDistanciaUltrasonidos),
            temperature: parseTemperatureHex(bytesTemperatura),
            relayState: parseStateHex(byteEstadoRele),
            hourOn: hexToIntStr(byteHoraEncendido),
            minuteOn: hexToIntStr(byteMinutoEncendido),
            hourOff: hexToIntStr(byteHoraApagado),
            minuteOff: hexToIntStr(byteMinutoApagado),
            schedulerMode: parseStateHex(byteModoScheduler)
        }
    }
    console.log("byteModoScheduler", byteModoScheduler)
}

// Decodificacion de datos V1 (horario)
function decodeBoilerPingScheduleV1(decodeDataHexRaw) {
    var decodeDataHex = decodeDataHexRaw.match(/.{1,2}/g);
    console.log("decodeDataHex SPLIT", decodeDataHex)
    var byteEstadoReles = decodeDataHex[1]
    var byteHoraEncendido = decodeDataHex[4]
    var byteMinutoEncendido = decodeDataHex[5]
    var byteHoraApagado = decodeDataHex[6]
    var byteMinutoApagado = decodeDataHex[7]
    var byteModoScheduler = decodeDataHex[8]
        // Si esta en modo manual no modifico el horario
    if (!parseStateHex(byteModoScheduler)) {
        return {
            relayState: parseStateHex(byteEstadoReles),
            schedulerMode: parseStateHex(byteModoScheduler)
        }
    } else {
        return {
            relayState: parseStateHex(byteEstadoReles),
            hourOn: hexToIntStr(byteHoraEncendido),
            minuteOn: hexToIntStr(byteMinutoEncendido),
            hourOff: hexToIntStr(byteHoraApagado),
            minuteOff: hexToIntStr(byteMinutoApagado),
            schedulerMode: parseStateHex(byteModoScheduler)
        }
    }
}

// Decodificacion de datos V1 (horario) 
// ** SOLO COJO EL ESTADO DEL RELE **
function decodeBoilerPingScheduleV1rele(decodeDataHexRaw) {
    var decodeDataHex = decodeDataHexRaw.match(/.{1,2}/g);
    console.log("decodeDataHex SPLIT", decodeDataHex)
    var byteEstadoReles = decodeDataHex[1]
    return {
        releStatus: parseStateHex(byteEstadoReles),
    }

}

// Decodificacion de datos V1 (temperatura y distancia)
function decodeBoilerPingTemperatureDistanceV1(decodeDataHexRaw) {
    var decodeDataHex = decodeDataHexRaw.match(/.{1,2}/g);
    console.log("decodeDataHex SPLIT", decodeDataHex)
    var byteDistanciaUltrasonidos = decodeDataHex[5] + decodeDataHex[4]
    var byteTemperatura = decodeDataHex[9] + decodeDataHex[8]
    console.log("byteTemperatura", byteTemperatura)
    console.log("byteDistanciaUltrasonidos", byteDistanciaUltrasonidos)
    var resultParsed = {
        temperature: parseTemperatureHex(byteTemperatura),
        distance: parseDistanceHex(byteDistanciaUltrasonidos)
    }
    return resultParsed
}

function parseStateHex(relayStateHexMsg) {
    let decodedString = hexToIntStr(relayStateHexMsg);
    if (decodedString == "0") {
        return false
    } else if (decodedString == "255") {
        return true
    }
}

function parseDistanceHex(distanceHexMsg) {
    return makeLastNumberDecimal(hexToIntStr(distanceHexMsg));
}

function parseTemperatureHex(distanceHexMsg) {
    return makeLastTwoNumbersDecimal(hexToIntStr(distanceHexMsg));
}

function makeLastNumberDecimal(numberStr) {
    var lastNumber = numberStr.substring(numberStr.length - 1);
    var decimal = numberStr.substring(0, numberStr.length - 1);
    var decimal = decimal + "." + lastNumber;
    return decimal;
}

function makeLastTwoNumbersDecimal(numberStr) {
    var lastNumber = numberStr.substring(numberStr.length - 2);
    var decimal = numberStr.substring(0, numberStr.length - 2);
    var decimal = decimal + "." + lastNumber;
    return decimal;
}

function hexToIntStr(hexString) {
    return parseInt(hexString, 16).toString();
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

/* DB & MQTT CONFIG */
const mqtt = require('mqtt')
const request = require('request');

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

/* CONFIG END */
async function main() {
    let querySql = `SELECT boiler_device.id as boilerId, sensor_gateway_pkid.mac_number as device_gateway, sensor_info.device_EUI as boilerDeviceEUI FROM boiler_device INNER JOIN 
sensor_info ON sensor_info.id=boiler_device.sensorId INNER JOIN sensor_gateway_pkid ON sensor_gateway_pkid.sensor_id=boiler_device.sensorId`

    let storedData = []
    let idRelatedToBoilerDeveui = []
    query(querySql).then(rows => {

        console.log("resBoilers", rows)
        rows.forEach(element => {
            storedData.push({
                device_gateway_mac: element.device_gateway,
                boilerDeviceEUI: element.boilerDeviceEUI
            })
            idRelatedToBoilerDeveui[element.boilerDeviceEUI] = element.boilerId
        });

        const client = mqtt.connect('mqtts://gesinen.es:8882', options)

        client.on('connect', function() {
            console.log('Connected')
            console.log("storedData", storedData)
            console.log("idRelatedToBoilerDeveui", idRelatedToBoilerDeveui)
                // Reset handler topic
            client.subscribe('boiler/service/reset', function(err) {
                if (!err) {
                    console.log("subscrito a Reset handler topic => boiler/service/reset")
                } else {
                    console.log(err)
                }
            })
            storedData.forEach(element => {
                // Me subscribo a todos los gateways
                client.subscribe(element.device_gateway_mac + '/application/1/device/' + element.boilerDeviceEUI + "/rx", function(err) {
                    if (!err) {
                        console.log("subscrito a " + element.device_gateway_mac + '/application/1/device/' + element.boilerDeviceEUI + "/rx")
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

            if (topic != undefined && topic == "boiler/service/reset") {
                console.log("// reseting boiler service... //")
                client.end()
                main()
            } else {
                console.log("message", JSON.parse(message.toString()))
                let messageJSON = JSON.parse(message.toString())
                    // MODELO SENSOR TEMPERATURA MODBUS
                    /*if (topic != undefined && messageJSON.object.DecodeDataHex != undefined) {
                        let boilerId = idRelatedToBoilerDeveui[topic.split("/")[4]]
                        console.log("message", messageJSON)
                        let pingData = updateBoilerOnDatabaseV2(messageJSON.object.DecodeDataHex)
                        updateBoilerOnDatabase(boilerId, pingData)
                    }*/

                if (topic != undefined && messageJSON.object.DecodeDataHex != undefined) {
                    // SCHEDULE - PING
                    if (messageJSON.object.DecodeDataHex.substring(0, 2) == "0a") {
                        let boilerId = idRelatedToBoilerDeveui[topic.split("/")[4]]
                        console.log("message", messageJSON)
                            // FULL PING DATA
                            // let pingData = decodeBoilerPingScheduleV1(messageJSON.object.DecodeDataHex)

                        // ONLY RELE
                        let pingData = decodeBoilerPingScheduleV1rele(messageJSON.object.DecodeDataHex)
                        updateBoilerOnDatabaseStatusV1(boilerId, pingData)
                    } else {
                        let boilerId = idRelatedToBoilerDeveui[topic.split("/")[4]]
                        console.log("message", messageJSON)
                        let pingData = decodeBoilerPingTemperatureDistanceV1(messageJSON.object.DecodeDataHex)
                        updateBoilerOnDatabaseDistTempV1(boilerId, pingData)
                    }
                }
            }
        })
    })
}

async function updateBoilerOnDatabaseScheduleV1(boilerId, pingData) {
    pingData.id = boilerId
    console.log("pingData", pingData)
    var options = {
        'method': 'PUT',
        'url': 'http://localhost:8080/v2/boiler/devices/pingScheduleV1',
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pingData)
    };

    request(options, function(error, response) {
        if (error) throw new Error(error);
        console.log("updateRes", response.body);
        let jsonRes = JSON.parse(response.body)
        console.log("jsonRes", jsonRes)
    });

}

async function updateBoilerOnDatabaseStatusV1(boilerId, pingData) {
    pingData.id = boilerId
    console.log("pingData", pingData)
    var options = {
        'method': 'PUT',
        'url': 'http://localhost:8080/v2/boiler/devices/status',
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pingData)

    };
    request(options, function(error, response) {
        if (error) throw new Error(error);
        console.log("updateRes", response.body);
        let jsonRes = JSON.parse(response.body)
        console.log("jsonRes", jsonRes)
    });

}

async function updateBoilerOnDatabaseDistTempV1(boilerId, pingData) {
    pingData.id = boilerId
    console.log("pingData", pingData)
    var options = {
        'method': 'PUT',
        'url': 'http://localhost:8080/v2/boiler/devices/pingDistTempV1',
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pingData)

    };
    request(options, function(error, response) {
        if (error) throw new Error(error);
        console.log("updateRes", response.body);
        let jsonRes = JSON.parse(response.body)
        console.log("jsonRes", jsonRes)
    });

}

async function updateBoilerOnDatabaseV2(boilerId, pingData) {
    pingData.id = boilerId
    console.log("pingData", pingData)
    var options = {
        'method': 'PUT',
        'url': 'http://localhost:8080/v2/boiler/devices/ping',
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pingData)

    };
    request(options, function(error, response) {
        if (error) throw new Error(error);
        console.log("updateRes", response.body);
        let jsonRes = JSON.parse(response.body)
        console.log("jsonRes", jsonRes)
    });

}

main()