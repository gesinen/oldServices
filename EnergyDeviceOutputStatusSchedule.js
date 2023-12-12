var mqtt    = require('mqtt');
var each = require('sync-each');
var client  = mqtt.connect('mqtts://gesinen.es:8882',{username:'gesinen',password:'gesinen2110'});
var asyncLoop = require('node-async-loop');
var schedule = require('node-schedule');
var db = require('./database/swat_db');
  
var j = schedule.scheduleJob('*/1 * * * *', function(){
  	console.log('Start Energy Output status scheduel....');
	db.getConnection(function(err,connection){
		if(err){
		console.log('error---: getting data base connection '+err);
		}
		connection.query("select sgp.mac_number as gateway,g.id as gatewayId, g.application as gatewayAPP,g.application_name as gatewayAppName,s.*,e.id as energyId, e.name as energyDeviceName,eo.id as outputId,eo.output as outputNumber,eo.name as outputName,eo.status as outputStatus from swat_gesinen.energy_devices as e left join swat_gesinen.sensor_info as s ON e.sensor_id = s.id left join swat_gesinen.energy_device_output as eo ON e.id = eo.energy_id left join swat_gesinen.sensor_gateway_pkid as sgp ON sgp.sensor_id = s.id left join swat_gesinen.gateways as g ON sgp.mac_number = g.mac",function(err,rows){	
			if(err){
			console.log('error---: select query Error'+err);
			}
			console.log(rows.length);
			let result = [];
			
			if(rows.length > 0) {
				
				asyncLoop(rows, function(element, next) {
					if(element.gateway != null && element.gatewayAPP != null){
						//console.log(element);
						result.push({gateway: element.gateway,gatewayId: element.gatewayId,gatewayAPP: element.gatewayAPP,gatewayAppName: element.gatewayAppName, sensorId: element.id,
						sensorName:element.name,sesnorDeviceEUI:element.device_EUI,
						energyDeviceId:element.energyId,energyDeviceName:element.energyDeviceName,
						outputId:element.outputId,outputNumber:element.outputNumber,
						outputName:element.outputName,outputStatus:element.outputStatus});
						let topic = element.gateway+"/application/"+element.gatewayAPP+"/device/"+element.device_EUI+"/tx";
						let message =  '{ "confirmed": true,';  
							message += '"fPort":10,';
							message += '"data":"Z2w="';  
							message += '}';
							console.log(topic,message);
							
							client.publish(topic, message);
							//client.publish(element.gateway+'/application/'+element.gatewayAPP+'/device/'+element.device_EUI+'/tx', '{"confirmed":true,"fPort": 10,"data":"Z2w="}');
							
						}				
					
					next();
				});
			
				//console.log(result.length);
				//console.log(result);
			}
			
		});
	});
});
	