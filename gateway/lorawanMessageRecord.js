module.exports = function(client,data,mac,topic) { 
	var db = require('../database/swat_db');	
    var parseData= JSON.parse(data);
	
	if(parseData.devEUI){
	var devEUI = (parseData.devEUI).toLowerCase(); 
	var sensorName = parseData.deviceName;
	var messageData = parseData.data;
	var messageTopic =  topic;
	var fullMessage = data;
	var topicarray = (topic.toString()).split('/');	
	var requestType = topicarray[topicarray.length - 1];
	//var gatewayID = parseData.rxInfo[0].gatewayID;
	//console.log('mac',mac, 'devEUI',devEUI);
	
	var messageTime = getDateTime();//gatewayTimestamp.replace(/T/, ' ').replace(/\..+/, '')
	//console.log(messageTime);
	
	db.getConnection(function(err,connection){
		if(err){
		console.log('error---:'+err);
		}		
		var query = "SELECT * from swat_gesinen.lorawan_message_record where LOWER(device_Eui)='"+ devEUI +"' AND LOWER(gateway) ='"+mac+"' AND request_type = 'tx'";
		
		var r = connection.query(query, function(err,results) { 
			
			if(results.length > 0)
			{
					//console.log('Lorawan Message Record file');
	//console.log('topic',topic);
	//console.log('lorawanMesage',parseData);
	//console.log('lorawanMesage devEUI',parseData.devEUI);
					insertQuery = "insert into swat_gesinen.lorawan_message_record (gateway,device_Eui,sensor_name,message_data,request_type,message_topic,full_message,message_datetime) values('"+mac+"','"+devEUI+"','"+sensorName+"','"+messageData+"','"+requestType+"','"+messageTopic+"','"+fullMessage+"','"+messageTime+"')";
				
					connection.query(insertQuery,function(err,rows){
						   //connection.release();			 
							if(err) {					
							  console.log('inserting Lorawan Message Record Error: ' + err);
							connection.release();
						}           
					});
			}
			
		});
		connection.release();
	});
	
	}

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
    var dateTime = year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second;   
     return dateTime;;
 }
}