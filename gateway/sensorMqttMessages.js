var mqtt    = require('mqtt');
var db = require('./database/swat_db');
var asyncLoop = require('node-async-loop');
//user: gesinen password: gesinen2110
const options = {};
options.username <- 'gesinen';
options.password <- 'gesinen2110';
var client  = mqtt.connect('mqtts://gesinen.es:8882',{username:'gesinen',password:'gesinen2110'});  
client.on('connect', function () {
	client.subscribe('+/application/+/device/+/#');
	console.log('Connected...');
	});
	client.on('message', function (topic,message) {
	try {
		
 var parseData= JSON.parse(message);
 //console.log('mqttlog',topic,parseData);
 let completeMessage ='';
	let gatewayMac ='';
	//let topic= '';
	let devicEUI =null;
	let drValue =null;
	let rssiValue=null;
	let messageDatetime=null;
  	//console.log('Gateway Sensor Activity Log..',topic,parseData);
	var topicarray = (topic.toString()).split('/');
	if(topicarray.length > 3 ){
		gatewayMac = topicarray[0];
		devicEUI = topicarray[4];
		//console.log('txinfo',parseData.txInfo);
		if(parseData.txInfo){
			//console.log('txinfodr',parseData.txInfo.dr);
		drValue = parseData.txInfo.dr ;
		}
		else{
			drValue = null ;
		}
		if(parseData.rxInfo){
			//console.log('rxInfo',parseData.rxInfo[0].rssi);
			rssiValue = parseData.rxInfo[0].rssi;
		}
		
	}
	else{
			gatewayMac = topicarray[0];
			
	}
	completeMessage = message;
	//console.log(gatewayMac,devicEUI,drValue);
	db.getConnection(function(err,connection){
		
		if(err){
				console.log('mqtt log error---:'+err);
				//connection.release();
				}
	//console.log('mqtt defined log info',gatewayMac,devicEUI,drValue);				
		connection.query("select * from mqtt_log_defined where LOWER(gateway) = '"+gatewayMac+ "' and LOWER(sensor) = '"+devicEUI+"'",function(err,rows){	
			//console.log('mqtt defined log',rows);
			//console.log((new Date()).setHours(0,0,0,0));
			
			connection.release();
			//console.log(rows.length);
			if(rows.length > 0) {
				asyncLoop(rows, function(element, next) {
					console.log('mqtt Log File',element.from_period,element.to_period);
					let fromDate = element.from_period;
					let toDate = element.to_period;
					let currentDate = new Date();//2021-11-11T09:04:57.543Z
					
					currentDate.setHours(0,0,0,0);// 1636588800000
					fromDate.setHours(0,0,0,0);
					toDate.setHours(0,0,0,0);
					if(currentDate >= fromDate && currentDate < toDate){
						if(err){
							console.log('error---'+err);
							//connection.release();
							}
							queryInsert="INSERT INTO swat_gesinen.sensor_mqtt_messages_log (complete_message,gateway_mac,topic, device_eui,dr_value,rssi_value) VALUES ('"+completeMessage+"', '"+gatewayMac+"', '"+topic+"','"+devicEUI+"', '"+drValue+"', '"+rssiValue+"')";
								console.log('mqtt log inserting',gatewayMac,devicEUI);
								db.getConnection(function(err,connection){
									if(err){
									console.log('mqtt log error---:'+err);
									//connection.release();
									}
									connection.query(queryInsert,function(error,data){
									connection.release();	
																			
									if(error) {					
										console.log('insert error in water sensor_mqtt_messages_log value ' + err);
										//connection.release();					
						}
								})
								
				
			});
					}
				next();
				})
			}
			else{
				//connection.release();
			}
		})
		
	})
		
		
	}catch(e) {
	console.log(e.message);
      }
	});

/*module.exports = function(client,data,topic) {
var db = require('../database/swat_db');
var asyncLoop = require('node-async-loop');
 var parseData= JSON.parse(data);
 
 //var gatewayId = parseData.gatewayId; //"b827eb59b3b0";
	//var gatewayTimestamp = parseData.gatewayTimestamp; //"2021-01-18T08:27:32.8434921Z";
	//gatewayTimestamp = gatewayTimestamp.replace(/T/, ' ').replace(/\..+/, '')
	let completeMessage ='';
	let gatewayMac ='';
	//let topic= '';
	let devicEUI =null;
	let drValue =null;
	let rssiValue=null;
	let messageDatetime=null;
  	//console.log('Gateway Sensor Activity Log..',topic,parseData);
	var topicarray = (topic.toString()).split('/');
	if(topicarray.length > 3 ){
		gatewayMac = topicarray[0];
		devicEUI = topicarray[4];
		//console.log('txinfo',parseData.txInfo);
		if(parseData.txInfo){
			//console.log('txinfodr',parseData.txInfo.dr);
		drValue = parseData.txInfo.dr ;
		}
		else{
			drValue = null ;
		}
		if(parseData.rxInfo){
			//console.log('rxInfo',parseData.rxInfo[0].rssi);
			rssiValue = parseData.rxInfo[0].rssi;
		}
		
	}
	else{
			gatewayMac = topicarray[0];
			
	}
	completeMessage = data;
	//console.log(gatewayMac,devicEUI,drValue);
	db.getConnection(function(err,connection){
		
		if(err){
				console.log('mqtt log error---:'+err);
				//connection.release();
				}
	//console.log('mqtt defined log info',gatewayMac,devicEUI,drValue);				
		connection.query("select * from mqtt_log_defined where LOWER(gateway) = '"+gatewayMac+ "' and LOWER(sensor) = '"+devicEUI+"'",function(err,rows){	
			//console.log('mqtt defined log',rows);
			//console.log((new Date()).setHours(0,0,0,0));
			
			//connection.release();
			
			if(rows.length > 0) {
				asyncLoop(rows, function(element, next) {
					console.log('mqtt Log File',element.from_period,element.to_period);
					let fromDate = element.from_period;
					let toDate = element.to_period;
					let currentDate = new Date();//2021-11-11T09:04:57.543Z
					
					currentDate.setHours(0,0,0,0);// 1636588800000
					fromDate.setHours(0,0,0,0);
					toDate.setHours(0,0,0,0);
					if(currentDate >= fromDate && currentDate < toDate){
						if(err){
							console.log('error---'+err);
							}
							queryInsert="INSERT INTO swat_gesinen.sensor_mqtt_messages_log (complete_message,gateway_mac,topic, device_eui,dr_value,rssi_value) VALUES ('"+completeMessage+"', '"+gatewayMac+"', '"+topic+"','"+devicEUI+"', '"+drValue+"', '"+rssiValue+"')";
								console.log('mqtt log inserting',gatewayMac,devicEUI);		
								connection.query(queryInsert,function(err,data){
									connection.release();	
																			
									if(err) {					
										console.log('insert error in water sensor_mqtt_messages_log value ' + err);
										//connection.release();					
						}
				
			});
					}
				next();
				})
			}
			else{
				connection.release();
			}
		})
		
	});	
}*/

function calcTime(city, offset) {

    // create Date object for current location
    d = new Date();
    
    // convert to msec
    // add local time zone offset 
    // get UTC time in msec
    utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    
    // create new Date object for different city
    // using supplied offset
    nd = new Date(utc + (3600000*offset));
    
    // return time as a string
	return nd.toLocaleString();
    //return "The local time in " + city + " is " + nd.toLocaleString();

}

 function getDateTime() {
    var currentTime     = calcTime('Madrid','+1');//new Date(); 
	var now =  new Date(currentTime);
    var year    = now.getFullYear();
    var month   = now.getMonth()+1; 
    var day     = now.getDate();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds(); 
    if(month.toString().length == 1) {
        var month = '0'+month;
    }
    if(day.toString().length == 1) {
        var day = '0'+day;
    }   
    if(hour.toString().length == 1) {
        var hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
        var minute = '0'+minute;
    }
    if(second.toString().length == 1) {
        var second = '0'+second;
    }   
    var dateTime = day+'/'+month+'/'+year+' '+hour+':'+minute+':'+second;   
     return dateTime;
}

 /*function splitDate(date) {
        var res: any;
        if (date) {
            var index = date.indexOf("T");  // Gets the first index where a space occours
            var first = date.substr(0, index); // Gets the first part
            // console.log(index);
            var second = date.substr(11, 8)
            res = {
                date: this.naiveReverse(first),
                time: second
            }

        }
        else {
            res = {
                date: '-- --',
                time: '--:--:--'
            }
        }
        return res;
    }*/

	let naiveReverse = function(string) {
		return string.split('-').reverse().join('-');
	}

