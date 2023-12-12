var mqtt    = require('mqtt');
var client  = mqtt.connect('mqtt://82.223.50.35');  
client.on('connect', function () {
  client.subscribe('application/1/device/+/rx');
  client.subscribe('device2clevergesinen/meter');
  //client.subscribe('application/1/device/0079e129d522e556/rx');
 // client.subscribe('device2clevergesinen/digitalInputWarning');
  
  //client.subscribe('/666');
  console.log('Connected...');
  
});
 
client.on('message', function (topic,message) {
	try {	
	console.log(message.toString());
        console.log(topic.toString());
		let topicArray = topic.split("/");
		var parseData= JSON.parse(message);
		 
		var items  = parseData.data;//"Y2QAAA==";
		var header = [];
	var   buf = Buffer.from(items, 'base64');	
	for(var j=0;j<buf.length;j++){
		var messageVal = parseInt(buf[j]);
		if(j<=3)
		{
			header.push(messageVal);
		}
				
	}
	console.log('header');
		console.log(header);
	//if(header[0]  == 99 && header[1] == 100)
	//if(topic=="application/1/device/"+topicArray[3]+"/rx")
	//{
		require('./routes/clever_device')(client,message);
	//}
	if(header[0] == 102 && header[1] == 100)	
	{
		console.log('header');
		console.log(header);
		require('./routes/clever_inputWarningViewPage')(client,message);
	}
	
	if(header[0] == 100 && (header[1] == 107 || header[1] == 100))	
	{
		console.log('meter');
		console.log(header);
		require('./routes/clever_meter')(client,message);
		require('./routes/outputStatusforMeter')(client,message);
	}
	
	if(header[0] == 104 && header[1] == 100 && header[2] == 255 && header[3] == 255)	
	{
		console.log('meter time error');
		console.log(header);
		require('./routes/clever_meter_timeError')(client,message);
	}
	
	if(header[0] == 103 && (header[1] == 108 ||  header[1] == 109  || header[1] == 107 ||  header[1] == 101) )	
	{
		console.log('meter time error');
		console.log(header);
		require('./routes/cleverOutputStatusUpdate')(client,message);
	}
	
	if(header[0] == 100 && header[1] == 110)	
	{
		console.log('header');
		console.log(header);
		require('./routes/cleverModbusTestResponse')(client,message);
	}
	
		if(header[0] == 103 && header[1] == 100)	
	{
		console.log('header');
		console.log(header);
		require('./routes/cleverDeviceOutputForzarResponse')(client,message);
	}
	
	
	//clever-gesinen routes start
	if(topic=="device2clevergesinen/meter")
	{
	  require('./routes/clever_meter')(client,message);
	}
	if(topic=="device2clevergesinen/digitalInputWarning")
	{
	  require('./routes/clever_digitalinputwarning')(client,message);
	}
	//clever-gesinen routes End
      } catch(e) {
	console.log(e.message);
      }
	 
	  
});