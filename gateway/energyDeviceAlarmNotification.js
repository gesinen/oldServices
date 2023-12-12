var asyncLoop = require('node-async-loop');
var nodemailer = require('nodemailer');
var smtpConfig = {
		host: 'smtp.1and1.es',
		port: 587,
		//secure: true, // use SSL
		auth: {
			user: 'alarms@geswat.com',//'no-reply@gesinen.es',
			pass: 'Team@1234$'
		}
	};

var transporter = nodemailer.createTransport(smtpConfig);
module.exports = function(client,data) { 
	//var data = {"applicationID":"2","applicationName":"app","deviceName":" 0079e129d52aa031","devEUI":"0079e129d52aa031","txInfo":{"frequency":868500000,"dr":5},"adr":true,"fCnt":720,"fPort":2,"data":"ZGsAvIgkAMi4JABQsyQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHJQIQExBCECwNwhAMAMGAGIQAwAAAAAA","object":{"DecodeDataHex":"0x64,0x6b,0x00,0xbc,0x88,0x24,0x00,0xc8,0xb8,0x24,0x00,0x50,0xb3,0x24,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x1c,0x94,0x08,0x40,0x4c,0x41,0x08,0x40,0xb0,0x37,0x08,0x40,0x30,0x03,0x06,0x00,0x62,0x10,0x03,0x00,0x00,0x00,0x00,0x00","DecodeDataString":"dk\u0000¼$\u0000È¸$\u0000P³$\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u001c\u0008@LA\u0008@°7\u0008@0\u0003\u0006\u0000b\u0010\u0003\u0000\u0000\u0000\u0000\u0000"}};
	//var datastring = data.replace(/\\/g, '');
	var db = require('../database/swat_db');	
    var parseData= JSON.parse(data);
	//var parseData = data;
	//console.log('notification Parse Data',parseData);	
	
	var deviceId = parseData.devEUI; //"0079e129d522e558";
	
		//console.log('notification deviceId='+deviceId);
		 
	var dataRecordArray = [];	
	var buffertodecarray = [];
	var phase = 1;
	var error = 0;
	var counterNumber = 0;
	var dataRecords  = parseData.data;	//"ZmgAD///";
	var buf = Buffer.from(dataRecords, 'base64');	
	//console.log(buf);
	for(var p = 0;p<buf.length;p++){
		buffertodecarray.push(parseInt(buf[p]));
	}
	//console.log(buffertodecarray.toString());
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
	//console.log('notification',dataRecordArray.toString());
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
		let valueRecieved = 0;
		//console.log('notification inside connection');
	//asyncLoop(arr, function(item, next) {
		
		//console.log(item.indexVal+"-"+item.inputVal);	
		
		//var query = "SELECT * from swat_gesinen.energy_device_define_alarms where deviceEUI='"+ deviceId +"'";
		var query = "select *, a.id as alarmId from swat_gesinen.energy_device_define_alarms as a left join swat_gesinen.energy_devices as e ON a.energy_device_id = e.id left join swat_gesinen.sensor_type_ibox_payload as stip ON e.sensor_meter_id = stip.id where a.deviceEUI ='"+ deviceId +"' and stip.meter_number="+counterNumber;// and stip.meter_number = " + counterNumber;
		connection.query(query, function(err,results) {
			//connection.release();
			//console.log(results)
			//var indexData = arr.indexOf( item );
			//console.log(indexData);
			//console.log('Notification',results);
			if(results.length > 0)
			{
				results.forEach((result)=>{
			//		console.log("updating this record:-"+result.variable_one);
				//	console.log(result.lower_value,arr[0].voltR);
				
					let  currentDatetime =	new Date(arr[0].mydate);
					let minutes = currentDatetime.getMinutes();
					let hours = currentDatetime.getHours();
					let time = hours+':'+minutes;
					if(result.alarm_type == 'Lower')
					{
					//	console.log('this is  time range',arr[0].mydate,result.from_time,result.to_time);
						if(result.from_time <  time && result.to_time > time){
							//console.log('this is in time range',arr[0].mydate,result.fromTime,result.toTime);
					
						//	console.log("inserting Lower");					
					
							var insert = false;
							switch (result.variable_one) {
								case 'voltR':
									insert = result.lower_value >= arr[0].voltR?true:false;
									valueRecieved = arr[0].voltR;
									break;
								case 'voltS':
									insert = result.lower_value >= arr[0].voltS?true:false;
									valueRecieved = arr[0].voltS;
									break;
								case 'voltT':
									insert = result.lower_value >= arr[0].voltT?true:false;
									valueRecieved = arr[0].voltT;
									break;
								case 'currentR':
									insert = result.lower_value >= arr[0].currentR?true:false;
									valueRecieved = arr[0].currentR;
									break;
								case 'currentS':
									insert = result.lower_value >= arr[0].currentS?true:false;
									valueRecieved = arr[0].currentS;
									break;
								case 'currentT':
									insert = result.lower_value >= arr[0].currentT?true:false;
									valueRecieved = arr[0].currentT;
									break;
								case 'activePowerR':
									insert = result.lower_value >= arr[0].activePowerR?true:false;
									valueRecieved = arr[0].activePowerR;
									break;
								case 'activePowerS':
									insert = result.lower_value >= arr[0].activePowerS?true:false;
									valueRecieved = arr[0].activePowers;
									break;
								case 'activePowerT':
									insert = result.lower_value >= arr[0].activePowerT?true:false;
									valueRecieved = arr[0].activePowerT;
									break;
								case 'powerFactorR':
									insert = result.lower_value >= arr[0].powerFactorR?true:false;
									valueRecieved = arr[0].powerFactorR;
									break;
								case 'powerFactorS':
									insert = result.lower_value >= arr[0].powerFactorS?true:false;
									valueRecieved = arr[0].powerFactorS;
									break;
								case 'powerFactorT':
									insert = result.lower_value >= arr[0].powerFactorT?true:false;
									valueRecieved = arr[0].powerFactorT;
									break;
								case 'activeEnergy':
									insert = result.lower_value >= arr[0].activeEnergy?true:false;
									valueRecieved = arr[0].activeEnergy;
									break;
								case 'reactiveEnergy':
									insert = result.lower_value >= arr[0].reactiveEnergy?true:false;
									valueRecieved = arr[0].reactiveEnergy;
									break;
							}
							//console.log('insert==',insert);
							if(result.alarm_flag == true){
								if(insert == true){
									db.getConnection(function(err,connection){
										if(err){
											console.log('error---:'+err);
										}
							
										connection.query("insert into swat_gesinen.energy_device_alarm_notification(sensor_id,alarm_type,deviceEUI,variable_one,variable_two,define_alarm_id,description,status,value_received,created_dt,updated_dt)values("+ result.sensor_id +",'"+ result.alarm_type +"','"+ deviceId +"','"+ result.variable_one +"','"+ result.variable_two +"', "+ result.id +",'"+ result.description +"', 'Active','"+valueRecieved+"','"+arr[0].mydate+"','"+arr[0].mydate+"')",function(err,rows){
											//connection.release();
											/**** Email ***/
											console.log('Email-sending to-'+result.alarm_email);
											var mailOptions = {
													from: 'no-reply@swat-id.gesinen.com',
													to: result.alarm_email,
													subject: 'Energy Alert',
													html:'<h1 style="Color:red">Alert!</h1><p>Device: <strong>'+ deviceId+'</strong></p><p> Alarm: <strong>'+result.alarm_type+'</strong></p><p> Detail: <strong>'+result.description+'</strong></p><p> Limit: <strong>'+result.variable_one+' Value: '+result.lower_value+'</strong></p><p>Value Recieved: <strong>'+valueRecieved+'</strong></p><p> Time: <strong>'+arr[0].mydate+'</strong></p>'
													// text: 'Device '+deviceEUI+' Alarm  '+ alarmType +' detail '+ description
												};

											transporter.sendMail(mailOptions, function(error, info){
												if (error) {
													console.log(error);
												} else {
													console.log('Energy Alert Email sent: ' + info.response);
												}
											});	
											/**** Email ***/
											if(err) {					
												console.log('insert Notification Error: ' + err);       
											}           
										});
										connection.query("update swat_gesinen.energy_device_define_alarms as a set a.alarm_flag = false where a.id = "+result.alarmId,function(err,rows){
											if(err) {					
												console.log('update energy_device_define Alarms Error: ' + err);       
											} 
										});
										connection.release();
									});
						
								}
							}
							else{
								db.getConnection(function(err,connection){
									if(err){
										console.log('error---:'+err);
									}
									if(insert == false){
										connection.query("update swat_gesinen.energy_device_define_alarms as a set a.alarm_flag = true where a.id = "+result.alarmId,function(err,rows){
											if(err) {					
												console.log('update energy_device_define Alarms Error: ' + err);       
											} 
										})
									}
								connection.release();
								});
							}
					
						}
					}
					else if(result.alarm_type == 'Over'){
						console.log("inserting Over");
						console.log('this is  time range',arr[0].mydate,result.from_time,result.to_time);
						if(result.from_time <  time && result.to_time > time){
							//console.log('this is in time range',arr[0].mydate,result.fromTime,result.toTime);
					
							var insert = false;
							switch (result.variable_one) {
								case 'voltR':
									insert = result.over_value <= arr[0].voltR?true:false;
									valueRecieved = arr[0].voltR;
									break;
								 case 'voltS':
									insert = result.over_value <= arr[0].voltS?true:false;
									valueRecieved = arr[0].voltS;
									break;
								case 'voltT':
									insert = result.over_value <= arr[0].voltT?true:false;
									valueRecieved = arr[0].voltT;
									break;
								case 'currentR':
									insert = result.over_value <= arr[0].currentR?true:false;
									valueRecieved = arr[0].currentR;
									break;
								case 'currentS':
									insert = result.over_value <= arr[0].currentS?true:false;
									valueRecieved = arr[0].currentS;
									break;
								case 'currentT':
									insert = result.over_value <= arr[0].currentT?true:false;
									valueRecieved = arr[0].currentT;
									break;
								case 'activePowerR':
									insert = result.over_value <= arr[0].activePowerR?true:false;
									valueRecieved = arr[0].activePowerR;
									break;
								case 'activePowerS':
									insert = result.over_value <= arr[0].activePowerS?true:false;
									valueRecieved = arr[0].activePowerS;
									break;
								case 'activePowerT':
									insert = result.over_value <= arr[0].activePowerT?true:false;
									valueRecieved = arr[0].activePowerT;
									break;
								case 'powerFactorR':
									insert = result.over_value <= arr[0].powerFactorR?true:false;
									valueRecieved = arr[0].powerFactorR;
									break;
								case 'powerFactorS':
									insert = result.over_value <= arr[0].powerFactorS?true:false;
									valueRecieved = arr[0].powerFactorS;
									break;
								case 'powerFactorT':
									insert = result.over_value <= arr[0].powerFactorT?true:false;
									valueRecieved = arr[0].powerFactorT;
									break;
								case 'activeEnergy':
									insert = result.over_value <= arr[0].activeEnergy?true:false;
									valueRecieved = arr[0].activeEnergy;
									break;
								case 'reactiveEnergy':
									insert = result.over_value <= arr[0].reactiveEnergy?true:false;
									valueRecieved = arr[0].reactiveEnergy;
									break;
							}
							if(result.alarm_flag == true){
								if(insert == true){
									db.getConnection(function(err,connection){
										if(err){
											console.log('error---:'+err);
										}
										console.log(result);
										connection.query("insert into swat_gesinen.energy_device_alarm_notification(sensor_id,alarm_type,deviceEUI,variable_one,variable_two,define_alarm_id,description,status,value_received,created_dt,updated_dt)values("+ result.sensor_id +",'"+ result.alarm_type +"','"+ deviceId +"','"+ result.variable_one +"','"+ result.variable_two +"', "+ result.id +",'"+ result.description +"', 'Active','"+valueRecieved+"','"+arr[0].mydate+"','"+arr[0].mydate+"')",function(err,rows){
											//connection.release();	
											/**** Email ***/
											console.log('Email-sending to-'+result.alarm_email);
											var mailOptions = {
													from: 'no-reply@swat-id.gesinen.com',
													to: result.alarm_email,
													subject: 'Energy Alert',
													//html:'<h1 style="Color:red">Alert!</h1><p>Device: <strong>'+ deviceId+'</strong></p><p> Alarm: <strong>'+result.alarm_type+'</strong></p><p> Detail: <strong>'+result.description+'</strong></p><p> Limit: <strong>'+result.variable_one+' Value: '+result.lower_value+'</strong></p><p>Value Recieved: <strong>'+valueRecieved+'</strong></p><p> Time: <strong>'+arr[0].mydate+'</strong></p>'
													html:'<h1 style="Color:red">Alert!</h1><p>Device: <strong>'+ deviceId+'</strong></p><p> Alarm: <strong>'+result.alarm_type+'</strong></p><p> Detail: <strong>'+result.description+'</strong></p><p> Limit: <strong>'+result.variable_one +' Value: '+result.over_value+'</strong></p><p>Value Recieved: <strong>'+valueRecieved+'</strong></p><p> Time: <strong>'+arr[0].mydate+'</strong></p>'
													// text: 'Device '+deviceEUI+' Alarm  '+ alarmType +' detail '+ description
												};

											transporter.sendMail(mailOptions, function(error, info){
												if (error) {
													console.log(error);
												} else {
												console.log('Energy Alert Email sent: ' + info.response);
												}
											});	
											/**** Email ***/						   
											if(err) {					
												console.log('insert Notification Error: ' + err);       
											}           
										});
						
										connection.query("update swat_gesinen.energy_device_define_alarms as a set a.alarm_flag = false where a.id = "+result.alarmId,function(err,rows){
											if(err) {					
												console.log('update energy_device_define Alarms Error: ' + err);       
											} 
										})
										connection.release();
						
									})
						
								}
							}
							else{
								db.getConnection(function(err,connection){
									if(err){
										console.log('error---:'+err);
									}
									if(insert == false){
										connection.query("update swat_gesinen.energy_device_define_alarms as a set a.alarm_flag = true where a.id = "+result.alarmId,function(err,rows){
											if(err) {					
												console.log('update energy_device_define Alarms Error: ' + err);       
											} 
										})
									}
									connection.release();
								});
							}
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
							connection.query("insert into swat_gesinen.energy_device_alarm_notification(sensor_id,alarm_type,deviceEUI,variable_one,variable_two,define_alarm_id,description,status)values("+ result.sensor_id +",'"+ result.alarm_type +"','"+ deviceId +"','"+ result.variable_one +"','"+ result.variable_two +"', "+ result.id +",'"+ result.description +"', 'Active')",function(err,rows){
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
