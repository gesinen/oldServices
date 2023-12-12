module.exports = function(client,data,mac) { 
	var db = require('../database/swat_db');	
    var parseData= JSON.parse(data);
	//console.log('Sensor Ping')
	//console.log(parseData);	
	var devEUI = (parseData.devEUI).toLowerCase(); //"b827eb59b3b0";
	//var gatewayID = parseData.rxInfo[0].gatewayID;
	console.log('mac',mac, 'devEUI',devEUI);
	//console.log('rxinfo',parseData.rxInfo);
	var RSSI = parseData.rxInfo != undefined ? parseData.rxInfo[0].rssi:'oldvalue';
	var loRaSNR = parseData.rxInfo != undefined ? parseData.rxInfo[0].loRaSNR : 'oldvalue';
	console.log('rssi'+RSSI,'lorasnr'+loRaSNR);
	var dr = parseData.txInfo.dr;
	var frequency = parseData.txInfo.frequency;
	var fCnt = parseData.fCnt;
	//console.log('DR RSSI deviceEUI-'+devEUI,'gatewayId'+gatewayID,'rssi'+RSSI,'loraSNR'+loRaSNR,'dr'+dr,'frequency'+frequency,'fCnt'+fCnt);
	db.getConnection(function(err,connection){
		if(err){
		console.log('error---:'+err);
		}		
		var query = "SELECT * from swat_gesinen.sensor_info where LOWER(device_EUI)='"+ devEUI +"'";
		
		var r = connection.query(query, function(err,results) { 
			
			let firstframecounterfCnt = null;
			let lostfCnt = null;
			let latestframeCounterfCnt = null;
			let prevframecounterfCnt = null;
			let Updatequery = '';
			if(results.length > 0)
			{
				if(RSSI == 'oldvalue')
				RSSI = results[0].rssi;
			
				if(loRaSNR == 'oldvalue')
				loRaSNR = results[0].lora_snr;
				
				console.log('RSSI '+RSSI,'loRaSNR '+loRaSNR);
				firstframecounterfCnt = results[0].first_frame_counter_fCnt;
				console.log('firstframecounterfCnt',firstframecounterfCnt);
				lostfCnt = results[0].lost_fCnt;
				if(firstframecounterfCnt == 'NULL' || firstframecounterfCnt == null){
					prevframecounterfCnt = fCnt;
					latestframeCounterfCnt = fCnt;
					firstframecounterfCnt = fCnt;
					lostfCnt = 0;
					Updatequery = "UPDATE swat_gesinen.sensor_info SET network_server_mac ='"+mac+"', rssi ="+RSSI+",first_frame_counter_fCnt="+firstframecounterfCnt+",prev_frame_counter_fCnt ="+prevframecounterfCnt+",lost_fCnt ="+lostfCnt+",lora_snr ="+loRaSNR+",latest_frame_counter_fCnt="+latestframeCounterfCnt+",frequency="+frequency+", dr="+dr+"  WHERE LOWER(device_EUI)='"+devEUI+"'";
				}
				else{
					latestframeCounterfCnt = fCnt;
					prevframecounterfCnt = results[0].latest_frame_counter_fCnt;
				 
					 
					  let difference = latestframeCounterfCnt - prevframecounterfCnt;
					  if(difference == 1){
						  lostfCnt = results[0].lost_fCnt;
					  }
					  else{
						  lostfCnt = lostfCnt + (difference - 1);
					  }
					 
					Updatequery = "UPDATE swat_gesinen.sensor_info SET network_server_mac ='"+mac+"', rssi ="+RSSI+",prev_frame_counter_fCnt ="+prevframecounterfCnt+",lost_fCnt ="+lostfCnt+",lora_snr ="+loRaSNR+",latest_frame_counter_fCnt="+latestframeCounterfCnt+",frequency="+frequency+", dr="+dr+"  WHERE LOWER(device_EUI)='"+devEUI+"'";
				}
				//console.log('Updatequery',Updatequery);
				connection.query(Updatequery,function(err,rows){
						   //connection.release();			 
							if(err) {					
							  console.log('updating sensor info Error: ' + err);       
						}           
					});
			}
			
		});
		connection.release();
	});
	
}