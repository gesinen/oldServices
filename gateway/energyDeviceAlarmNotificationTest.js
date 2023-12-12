var asyncLoop = require('node-async-loop');
module.exports = function(client,data) { 
	var db = require('../database/swat_db_test');	
    var parseData= JSON.parse(data);
	console.log('Notification for Test')
	console.log(parseData);	
	
	var deviceId = parseData.devEUI; //"0079e129d522e558";
	
		console.log('deviceId='+deviceId);
		 
	var dataRecordArray = [];	
	var buffertodecarray = [];
	var phase = 1;
	var error = 0;
	var counterNumber = 0;
	var dataRecords  = parseData.data;	//"ZmgAD///";
	var buf = Buffer.from(dataRecords, 'base64');	
	console.log(buf);
	for(var p = 0;p<buf.length;p++){
		buffertodecarray.push(parseInt(buf[p]));
	}
	console.log(buffertodecarray.toString());
	if(buffertodecarray.length == 4)
	{
		if(buffertodecarray[3] == 255)
		{
			error =1;
		}
	}
	for(var j=0;j<buffertodecarray.length;j++){
		if(j==1)
		{
			if(buffertodecarray[j] == 107)
			{
				phase =3;
			}
		}
		if(j==2)
		{
			counterNumber = buffertodecarray[j];
		}
				
	}
	var test = [];
	var count = 1;
	for(var p = 3;p<buffertodecarray.length;p++){
		
		if(count <= 4)
		{
		test.push(buffertodecarray[p]);
		count++;
		}
		if(count == 5)
		{
			var new_array  = test.reverse();
			var str = '';
			//console.log(new_array);
			for(var k = 0 ;k<new_array.length;k++)
			{
				//console.log(parseInt(buf[k]));
				//console.log(dec_to_bho((parseInt(buf[k])),'B'));
				str += dec_to_bho((new_array[k]),'B');
				//console.log(str);
			}
			var digit = parseInt(str, 2);
			dataRecordArray.push(digit);
			//console.log(dataRecordArray);
			count =1;
			test =[];
		}
		
		
	}
	console.log(dataRecordArray.toString());
	var arr = [];
	
		arr.push({
			"deviceId":deviceId,
			"phase":phase,
			"counterNumber":counterNumber,
			"voltR": dataRecordArray[0]/10000,
			"voltS": dataRecordArray[1]/10000,
			"voltT": dataRecordArray[2]/10000,
			"currentR":(convertToInt32(dataRecordArray[3]))/10000,
			"currentS":(convertToInt32(dataRecordArray[4]))/10000,
			"currentT":(convertToInt32(dataRecordArray[5]))/10000,
			"activePowerR":(convertToInt32(dataRecordArray[6]))/10,
			"activePowerS":(convertToInt32(dataRecordArray[7]))/10,
			"activePowerT":(convertToInt32(dataRecordArray[8]))/10,			
			"powerFactorR":(convertToInt32(dataRecordArray[9]))/10000,
			"powerFactorS":(convertToInt32(dataRecordArray[10]))/10000,
			"powerFactorT":(convertToInt32(dataRecordArray[11]))/10000,			
			"activeEnergy":(convertToInt32(dataRecordArray[16]))/10000,
			"reactiveEnergy":(convertToInt32(dataRecordArray[17]))/10000,
			"mydate": getDateTime()
		});
		
	
	
	//console.log(arr.length);
	db.getConnection(function(err,connection){
		if(err){
		console.log('error---:'+err);
		}
		
	//asyncLoop(arr, function(item, next) {
		
		//console.log(item.indexVal+"-"+item.inputVal);	
		
		var query = "SELECT * from gateway_platform_test.energy_device_define_alarms where deviceEUI='"+ deviceId +"'";
		
		var r = connection.query(query, function(err,results) { 
			//console.log(results)
			//var indexData = arr.indexOf( item );
			//console.log(indexData);
			
			if(results.length > 0)
			{
				results.forEach((result)=>{
				console.log("updating this record:-"+result.variable_one);
				console.log(result.lower_value,arr[0].voltR);
			
					
				if(result.alarm_type == 'Lower')
				{
					console.log("inserting Lower");
					console.log("inserting Lower")
					
					var insert = false;
					switch (result.variable_one) {
					  case 'voltR':
						insert = result.lower_value >= arr[0].voltR?true:false;
						break;
					  case 'voltS':
						insert = result.lower_value >= arr[0].voltS?true:false;
						break;
					  case 'voltT':
						insert = result.lower_value >= arr[0].voltT?true:false;;
						break;
						case 'currentR':
						insert = result.lower_value >= arr[0].currentR?true:false;
						break;
						case 'currentS':
						insert = result.lower_value >= arr[0].currentS?true:false;
						break;
						case 'currentT':
						insert = result.lower_value >= arr[0].currentT?true:false;
						break;
						case 'activePowerR':
						insert = result.lower_value >= arr[0].activePowerR?true:false;
						break;
						case 'activePowerS':
						insert = result.lower_value >= arr[0].activePowerS?true:false;
						break;
						case 'activePowerT':
						insert = result.lower_value >= arr[0].activePowerT?true:false;
						break;
						case 'powerFactorR':
						insert = result.lower_value >= arr[0].powerFactorR?true:false;
						break;
						case 'powerFactorS':
						insert = result.lower_value >= arr[0].powerFactorR?true:false;
						break;
						case 'powerFactorT':
						insert = result.lower_value >= arr[0].powerFactorR?true:false;
						break;
						case 'activeEnergy':
						insert = result.lower_value >= arr[0].activeEnergy?true:false;
						break;
						case 'reactiveEnergy':
						insert = result.lower_value >= arr[0].reactiveEnergy?true:false;
						break;
						}
					console.log('insert==',insert);
					if(insert == true){
					connection.query("insert into gateway_platform_test.energy_device_alarm_notification(sensor_id,alarm_type,deviceEUI,variable_one,variable_two,define_alarm_id,description,status)values("+ result.sensor_id +",'"+ result.alarm_type +"','"+ deviceId +"','"+ result.variable_one +"','"+ result.variable_two +"', "+ result.id +",'"+ result.description +"', 'Active')",function(err,rows){
						   //connection.release();			 
							if(err) {					
							  console.log('insert Notification Error: ' + err);       
						}           
					});
					}
				}
				else if(result.alarm_type == 'Over'){
					console.log("inserting Over")
					var insert = false;
					switch (result.variable_one) {
					  case 'voltR':
						insert = result.over_value <= arr[0].voltR?true:false;
						break;
					  case 'voltS':
						insert = result.over_value <= arr[0].voltS?true:false;
						break;
					  case 'voltT':
						insert = result.over_value <= arr[0].voltT?true:false;;
						break;
						case 'currentR':
						insert = result.over_value <= arr[0].currentR?true:false;
						break;
						case 'currentS':
						insert = result.over_value <= arr[0].currentS?true:false;
						break;
						case 'currentT':
						insert = result.over_value <= arr[0].currentT?true:false;
						break;
						case 'activePowerR':
						insert = result.over_value <= arr[0].activePowerR?true:false;
						break;
						case 'activePowerS':
						insert = result.over_value <= arr[0].activePowerS?true:false;
						break;
						case 'activePowerT':
						insert = result.over_value <= arr[0].activePowerT?true:false;
						break;
						case 'powerFactorR':
						insert = result.over_value <= arr[0].powerFactorR?true:false;
						break;
						case 'powerFactorS':
						insert = result.over_value <= arr[0].powerFactorR?true:false;
						break;
						case 'powerFactorT':
						insert = result.over_value <= arr[0].powerFactorR?true:false;
						break;
						case 'activeEnergy':
						insert = result.over_value <= arr[0].activeEnergy?true:false;
						break;
						case 'reactiveEnergy':
						insert = result.over_value <= arr[0].reactiveEnergy?true:false;
						break;
						}
					if(insert == true){
						console.log(result);
					connection.query("insert into gateway_platform_test.energy_device_alarm_notification(sensor_id,alarm_type,deviceEUI,variable_one,variable_two,define_alarm_id,description,status)values("+ result.sensor_id +",'"+ result.alarm_type +"','"+ deviceId +"','"+ result.variable_one +"','"+ result.variable_two +"', "+ result.id +",'"+ result.description +"', 'Active')",function(err,rows){
						   //connection.release();			 
							if(err) {					
							  console.log('insert Notification Error: ' + err);       
						}           
					});
					}
				}
				else if(result.alarm_type == 'Different Status'){
					console.log("inserting Different Status Check")
					var insert = false;
					let variable1 = result.variable_one;
					let variable2 = result.variable_2;
					if (result.variable_one ) {
					  
						}
					if(insert == true){
					connection.query("insert into gateway_platform_test.energy_device_alarm_notification(sensor_id,alarm_type,deviceEUI,variable_one,variable_two,define_alarm_id,description,status)values("+ result.sensor_id +",'"+ result.alarm_type +"','"+ deviceId +"','"+ result.variable_one +"','"+ result.variable_two +"', "+ result.id +",'"+ result.description +"', 'Active')",function(err,rows){
						   //connection.release();			 
							if(err) {					
							  console.log('insert Notification Error: ' + err);       
						}           
					});
					}
				}
				else{}
				});	
			}		
			
		});
		
		//next();
		
		//});
		connection.release();	
	});

}

function convertToInt32(number){
	var hexNumber = number.toString(16);     	
        var int32Number = parseInt(hexNumber, 16) | 0;
		return int32Number;
}

function dec_to_bho(n, base) {
 
    if (n < 0) {
      n = 0xFFFFFFFF + n + 1;
     } 
	 
	switch (base)  
	{  
		case 'B':  
		var n = parseInt(n, 10).toString(2);
		n = "00000000".substr(n.length)+n;
		return n;
		break;  
		case 'H':  
		return parseInt(n, 10).toString(16);
		break;  
		case 'O':  
		return parseInt(n, 10).toString(8);
		break;  
		default:  
		return("Wrong input.........");  
	}  
}

function reverse(s){
    return s.split("").reverse().join("");
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
    var dateTime = year+'/'+month+'/'+day+' '+hour+':'+minute+':'+second;   
     return dateTime;
}
