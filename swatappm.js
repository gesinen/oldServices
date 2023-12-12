var mqtt    = require('mqtt');
//user: gesinen password: gesinen2110
const options = {};
options.username <- 'gesinen';
options.password <- 'gesinen2110';
//client.connect(URL + ":" + PORT.tostring(), cid, options);
var client  = mqtt.connect('mqtts://gesinen.es:8882',{username:'gesinen',password:'gesinen2110'});  
client.on('connect', function () {
	client.subscribe('b827eb98e519/application/1/device/+/rx');
	client.subscribe('+/application/+/device/+/rx');
	client.subscribe('+/application/+/device/+/#');
	client.subscribe('+/gateway_requests/ping');
	//client.subscribe('b827eb98e519/application/1/device/0079e129d522e565/rx');
	//client.subscribe('b827eb98e519/gateway_requests/ping');
	//client.subscribe('b827eb98e519/gateway_requests/request');
	//client.subscribe('b827eb98e519/gateway_requests/response'); 
	//client.subscribe('+/gateway_requests/request');
	client.subscribe('+/gateway_requests/response'); 
  //client.subscribe('gateway_requests/ping');
//client.subscribe('gateway_requests/B827EB7C3500/response'); 
  console.log('Connected...');
  
});
client.on('message', function (topic,message) {
	try {	
	//console.log(message.toString());
	//console.log(topic.toString());
		var topicarray = (topic.toString()).split('/');
		var lastElement = (topic.toString()).split('/').pop();
		//console.log('lastElement--',lastElement);
		var parseData= JSON.parse(message);
		if(lastElement != 'error'){
		//console.log(topic.toString());
		
		//Lorawan message record table inserting value
		//require('./gateway/lorawanMessageRecord')(client,message,topicarray[0],topic);
		
		// to save every message
		//require('./gateway/sensorMqttMessages')(client,message,topic);
		
		if(topic ==  topicarray[0]+ "/gateway_requests/ping")
		{
			//console.log('Gateway Ping',topicarray[0]);
			
			require('./gateway/gatewayping')(client,message);
			//require('./gateway/gatewaypingtest')(client,message);
		}
		if(topic !=  topicarray[0]+ "/gateway_requests/response" && topic != topicarray[0]+ "/gateway_requests/ping")
		{
		var items  = parseData.data;//"Y2QAAA==";
		var header = [];
		var headerNumber = [];
		//console.log('items-- outside',items);
		if(items != null){
			//console.log('items-- inside',items);
			var   buf = Buffer.from(items, 'base64');	
			for(var j=0;j<buf.length;j++){
				
				//console.log(buf[j]);
				var messageVal = buf[j].toString(16);//parseInt(buf[j],16);			
					header.push(messageVal);
				var messageValdecimal = buf[j].toString(10);
				headerNumber.push(messageValdecimal);
				
					
			}
		}
		//console.log(headerNumber);
		
		
		require('./gateway/sensorping')(client,message,topicarray[0]);
		//require('./gateway/sensorpingtest')(client,message,topicarray[0]);
		//console.log('gatewayId',topicarray[0]);
		//if(topicarray[0] == 'b827eb4b07fe'){
			//console.log('gatewayId',topicarray[0]);
		require('./gateway/sensorDRRSSIAllInfo')(client,message,topicarray[0]);//}
		if(items != null){
			//console.log(headerNumber);
			if(headerNumber[0] == 103 && headerNumber[1] == 100){
				//console.log(topic.toString());
				require('./gateway/energyDeviceOutputStatus')(client,message,headerNumber,topicarray[0],topicarray[4]);
				
			}
			if(header[0] == 66 && header[1] == 64){
				//console.log(topic.toString());
				require('./gateway/doorstatusupdate')(client,message,header,topicarray[0]);
				
			}
			if(header[0] == 100 && header[1] == 100){
				//console.log(message.toString());
			  require('./gateway/swatenergy')(client,message);
				
			}
			if(Number(headerNumber[0]) == 100 && Number(headerNumber[1]) == 107 && Number(headerNumber[3]) != 255){
				//console.log(headerNumber.toString());			
				//console.log(message.toString());
			  require('./gateway/swatenergy')(client,message);
			 // require('./gateway/swatenergytest')(client,message);
			  //console.log('notification message',message);
			 require('./gateway/energyDeviceAlarmNotification')(client,message);
			 //uncomment when want notification require('./gateway/energyDeviceAlarmNotificationTest')(client,message);
			}
		}
		
	}
		
	 
	 // console.log(parseData);
	  //var response = JSON.parse(parseData.response);
	  
	  
	  
	 // console.log(response);
	/*if(topic=="gateway_requests/ping")
	{
	 var parseData= JSON.parse(message);
	  console.log(parseData)	
	  }
	if(topic=="gateway_requests/B827EB7C3500/response")
	{
		  require('./gateway/sensorresponse')(client,message);	
	  }*/
	if(topic==  topicarray[0]+ "/gateway_requests/response")
	{
		//console.log(parseData);
		var responseCode  =  parseData.responseCode;
		var method = parseData.originalRequest.method;
		var patharray =  ((parseData.originalRequest.path).toString()).split('/');
		//console.log(responseCode);
		//console.log(method);
		//console.log(patharray);
		if(responseCode == 200 && method == "GET" && patharray[1] == "api" && patharray[2] == "applications?limit=10"){
			require('./gateway/gatewayApplicationSetIdResponse')(client,message,topicarray[0]);
		}
		
		if(responseCode == 200 && method == "GET" && patharray[1] == "api" && patharray[2] == "device-profiles?limit=10"){
			require('./gateway/gatewayProfileIdsetResponse')(client,message,topicarray[0]);
		}
		if(responseCode == 200 && method == "DELETE" && patharray[1] == "servers")
			{
				require('./gateway/serverdelete')(client,message,topicarray[0]);	
			}
		if(responseCode == 200 && method == "POST" && patharray[1] == "servers")
			{
				require('./gateway/serverresponse')(client,message,topicarray[0]);	
			}
		if(responseCode == 200 && method == "POST" && patharray[1] == "customsensors")
			{
				//console.log('sensor_type_gateway_pkid');
				require('./gateway/sensortypepayloadresponse')(client,message,topicarray[0]);	
			}
			
		//if(responseCode == 200 && method == "DELETE" && patharray[1] == "customsensors")
		//	{
		//		require('./gateway/sensortypepayloaddelete')(client,message,topicarray[0]);	
		//	}
			if(responseCode == 200  && patharray[1] != "servers")// && patharray[1] != "customsensors"
			{
				if(method == "POST"){
				var response = JSON.parse(parseData.response);
				//console.log('sensorAddress');
				//console.log(response.loraAddress);
				if(response.loraAddress && method == "POST")
					{
						//console.log('sensor_gateway_pkid');
						//console.log(response.loraAddress);
				  require('./gateway/sensorresponse')(client,message,topicarray[0]);	
				}
				}
				if(patharray[1] == "customsensordevices" && method == "DELETE")
					{
				  require('./gateway/sensordelete')(client,message,topicarray[0]);	
				}
				if(patharray[1] == "ibox" && method == "DELETE")
					{
						//console.log('Ibox Delete');
				//console.log(message);
				  require('./gateway/sensordelete')(client,message,topicarray[0]);	
				}
				if(patharray[1] == "wifi" && method == "DELETE")
					{
						//console.log('Wifi Delete');
				//console.log(message);
				  require('./gateway/sensordelete')(client,message,topicarray[0]);	
				}
				//if(response.serverName)
				///	{
				 // require('./gateway/serverresponse')(client,message);	
				//}
				//if(response.configurationName)
				//	{
				//  require('./gateway/sensortypepayloadresponse')(client,message,topicarray[0]);	
				//}
			}
	}
	//if(topic=="b827eb98e519/gateway_requests/response" && response.serverName != " ")
	//{
	//	  require('./gateway/serverresponse')(client,message);	
	//  }  
	if(topic=="b827eb98e519/application/1/device/0079e129d522e568/rx")
	{
		//console.log(message.toString());
		  require('./gateway/swatenergy')(client,message);	
	}
	}
	  
} catch(e) {
	console.log(e.message);
      }
	 
	  
});	

