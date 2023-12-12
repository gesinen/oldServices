module.exports = function(client,data,header,macNumber,deviceEUI) { 
	var db = require('../database/swat_db');
		
        var parseData= JSON.parse(data);
		//var response = JSON.parse(parseData.response);
		console.log('update output status','macNumber '+macNumber+'deviceEUI'+deviceEUI);
		console.log('output status data',parseData);
		
		
		 var query="";			 
			 query=" select s.id as sensorId,e.id as energyId,eo.id as outputId,eo.output as outputNumber,eo.name as outputName,eo.status as outputStatus from swat_gesinen.sensor_info as s left join swat_gesinen.energy_devices as e ON e.sensor_id = s.id left join swat_gesinen.energy_device_output as eo ON e.id = eo.energy_id where s.device_EUI ='"+ deviceEUI  +"'";
			 db.getConnection(function(err,connection){	
	connection.query(query ,function(err,rows){	
	if(err){
		console.log('error in getting---:'+err);
		}
		console.log(rows);
		rows.foreach(element=>{
			if(element.outputNumber == header[2]){
				queryUpdate = "update  energy_device_output set status="+header[3]+" where id = "+element.outputId;
				connection.query(queryUpdate,function(error,data){
																								
					if(error) {					
						console.log('insert error in water observation value: ' + err);       
					}
				})
			}
		});		 
	connection.release();
	});
	});
			
}