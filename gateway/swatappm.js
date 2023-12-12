var mqtt    = require('mqtt');
//user: gesinen password: gesinen2110
const options = {};
options.username <- 'gesinen';
options.password <- 'gesinen2110';
//client.connect(URL + ":" + PORT.tostring(), cid, options);
var client  = mqtt.connect('mqtts://gesinen.es:8882',{username:'gesinen',password:'gesinen2110'});  
client.on('connect', function () {
	client.subscribe('b827eb98e519/application/1/device/+/rx');
	client.subscribe('+/application/1/device/+/rx');
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
		var parseData= JSON.parse(message);
		if(topic !=  topicarray[0]+ "/gateway_requests/response")
		{
		var items  = parseData.data;//"Y2QAAA==";
		var header = [];
		var   buf = Buffer.from(items, 'base64');	
		for(var j=0;j<buf.length;j++){
			
			//console.log(buf[j]);
			var messageVal = buf[j].toString(16);//parseInt(buf[j],16);			
				header.push(messageVal);
			
				
		}
		//console.log(header);
		if(header[0] == 66 && header[1] == 64){
			console.log(topic.toString());
			require('./gateway/doorstatusupdate')(client,message,header,topicarray[0]);
			
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
		console.log(parseData);
		var responseCode  =  parseData.responseCode;
		var method = parseData.originalRequest.method;
		var patharray =  ((parseData.originalRequest.path).toString()).split('/');
		console.log(responseCode);
		console.log(method);
		console.log(patharray);
		
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
				require('./gateway/sensortypepayloadresponse')(client,message,topicarray[0]);	
			}
			
		//if(responseCode == 200 && method == "DELETE" && patharray[1] == "customsensors")
		//	{
		//		require('./gateway/sensortypepayloaddelete')(client,message,topicarray[0]);	
		//	}
			if(responseCode == 200  && patharray[1] != "servers")
			{
				if(method == "POST"){
				var response = JSON.parse(parseData.response);
				console.log('sensorAddress');
				console.log(response.loraAddress);
				if(response.loraAddress && method == "POST")
					{
						console.log(response.loraAddress);
				  require('./gateway/sensorresponse')(client,message,topicarray[0]);	
				}
				}
				if(patharray[1] == "customsensordevices" && method == "DELETE")
					{
				  require('./gateway/sensordelete')(client,message,topicarray[0]);	
				}
				if(patharray[1] == "ibox" && method == "DELETE")
					{
						console.log('Ibox Delete');
				console.log(message);
				  require('./gateway/sensordelete')(client,message,topicarray[0]);	
				}
				if(patharray[1] == "wifi" && method == "DELETE")
					{
						console.log('Wifi Delete');
				console.log(message);
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
		console.log(message.toString());
		  require('./gateway/swatenergy')(client,message);	
	}
	  
} catch(e) {
	console.log(e.message);
      }
	 
	  
});	

