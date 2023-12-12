module.exports = function(client,data) { 
	var db = require('../database/swat_db_test');	
    var parseData= JSON.parse(data);
	//console.log('gateway platform test  energy meter')
	//console.log(parseData);	
	
	var deviceId = parseData.devEUI; //"0079e129d522e558";
	
		//console.log('deviceId='+deviceId);
		 
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
//	console.log(dataRecordArray.toString());
	/*if(buf.length == 4)
	{
		if(parseInt(buf[3]) == 255)
		{
			error =1;
		}
	}
	for(var j=0;j<buf.length;j++){
		if(j==1)
		{
			if(parseInt(buf[j]) == 107)
			{
				phase =3;
			}
		}
		if(j==2)
		{
			counterNumber = parseInt(buf[j]);
		}
				
	}
	var test = [];
	var count = 1;
	for(var p = 3;p<buf.length;p++){
		
		if(count <= 4)
		{
		test.push(parseInt(buf[p]));
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
				str += dec_to_bho((parseInt(new_array[k])),'B');
				//console.log(str);
			}
			var digit = parseInt(str, 2);
			dataRecordArray.push(digit);
			//console.log(dataRecordArray);
			count =1;
			test =[];
		}
		
		
	}*/
	db.getConnection(function(err,connection){
		if(err){
		console.log('error---:'+err);
		}
		var mydate = getDateTime();
		//console.log('phase='+phase);
		//console.log('counterNumber='+counterNumber);
		if(phase != 3){
		var voltage = error == 1 ? 0:dataRecordArray[0]/10;
		var current = error == 1 ? 0:dataRecordArray[1]/1000;
		var activePower = error == 1 ? 0:(convertToInt32(dataRecordArray[2]))/10;
		var powerFactor = error == 1 ? 0:(convertToInt32(dataRecordArray[3]))/10000;		
		var activeEnergy = error == 1 ? 0:(convertToInt32(dataRecordArray[8]))/10000;
		var reactiveEnergy = error == 1 ? 0:(convertToInt32(dataRecordArray[9]))/10000;
		//console.log("'"+ deviceId +"','"+ counterNumber +"','"+ phase +"','"+ voltage +"','"+ current +"','"+ activePower +"','"+ powerFactor +"','"+ activeEnergy +"','"+ reactiveEnergy +"','"+ error +"','"+ mydate +"','"+ mydate +"'");
		connection.query("insert into gateway_platform_test.energy_meter_value	(device_id,counter_number,phase,volt_in_ver,current_ir,active_par,power_pfr,qat,qr_one_t,error_info,updated_dt,created_dt)values('"+ deviceId +"','"+ counterNumber +"','"+ phase +"','"+ voltage +"','"+ current +"','"+ activePower +"','"+ powerFactor +"','"+ activeEnergy +"','"+ reactiveEnergy +"','"+ error +"','"+ mydate +"','"+ mydate +"')",function(err,rows){
						   //connection.release();			 
							if(err) {					
							  console.log('meter Error: ' + err);       
						}           
					});
		}
		else{
			var voltageR = error == 1 ? 0:dataRecordArray[0]/10000;
			var voltageS = error == 1 ? 0:dataRecordArray[1]/10000;
			var voltageT = error == 1 ? 0:dataRecordArray[2]/10000;
			var currentR = error == 1 ? 0:dataRecordArray[3]/10000;
			var currentS = error == 1 ? 0:dataRecordArray[4]/10000;
			var currentT = error == 1 ? 0:dataRecordArray[5]/10000;
			 
			var activePowerR = error == 1 ? 0:(convertToInt32(dataRecordArray[6]))/10;
			var activePowerS = error == 1 ? 0:(convertToInt32(dataRecordArray[7]))/10;
			var activePowerT = error == 1 ? 0:(convertToInt32(dataRecordArray[8]))/10;			
			var powerFactorR = error == 1 ? 0:(convertToInt32(dataRecordArray[9]))/10000;
			var powerFactorS = error == 1 ? 0:(convertToInt32(dataRecordArray[10]))/10000;
			var powerFactorT = error == 1 ? 0:(convertToInt32(dataRecordArray[11]))/10000;			
			var activeEnergy = error == 1 ? 0:(convertToInt32(dataRecordArray[16]))/10000;
			var reactiveEnergy = error == 1 ? 0:(convertToInt32(dataRecordArray[17]))/10000;
			//console.log(deviceId +','+ counterNumber +','+ phase +','+ voltageR +','+ voltageS +','+ voltageT +','+ currentR +','+ currentS +','+ currentT +','+ activePowerR +','+ activePowerS +','+ activePowerT +','+ powerFactorR +','+ powerFactorS +','+ powerFactorT +','+ activeEnergy +','+ reactiveEnergy +','+ mydate +','+ mydate);
			connection.query("insert into gateway_platform_test.energy_meter_value	(device_id,counter_number,phase,volt_in_ver,volt_in_ves,volt_in_vet,current_ir,current_is,current_it,active_par,active_pas,active_pat,power_pfr,power_pfs,power_pft,qat,qr_one_t,updated_dt,created_dt)values('"+ deviceId +"','"+ counterNumber +"','"+ phase +"','"+ voltageR +"','"+ voltageS +"','"+ voltageT +"','"+ currentR +"','"+ currentS +"','"+ currentT +"','"+ activePowerR +"','"+ activePowerS +"','"+ activePowerT +"','"+ powerFactorR +"','"+ powerFactorS +"','"+ powerFactorT +"','"+ activeEnergy +"','"+ reactiveEnergy +"','"+ mydate +"','"+ mydate +"')",function(err,rows){
							   //connection.release();			 
								if(err) {					
								  console.log('meter  Error: ' + err);       
							}           
						});
			
		}
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

 