var db = require('./database/clever_db');
var mqtt    = require('mqtt');
var client  = mqtt.connect('mqtt://82.223.50.35');  
var schedule = require('node-schedule');
var SunCalc = require('suncalc');
var asyncLoop = require('node-async-loop');
//var sun=require('sun-time');
//var SolarCalc = require('solar-calc');
var j = schedule.scheduleJob('*/1 * * * *', function(){
console.log('Start schedule....');
var dataRecordArray = [];

db.getConnection(function(err,connection){
		if(err){
		console.log('error---:'+err);
		}
		connection.query("select DISTINCT OS.device_id, Os.output,DI.latitude,DI.longitude  from clever_gesinen.output_status OS , clever_gesinen.device_info DI  where  OS.device_id = DI.device_id;",function(err,data){
			result = JSON.stringify(data);
		result = JSON.parse(result);		
		if(result.length>0)
		{
			console.log(result);
			for(var i=0;i<result.length;i++){
				var deviceId = result[i].device_id;
				var output = result[i].output;
				var sunriseStr = "";
				var sunsetStr = "";
		
		
		/**/
		/*connection.query("select * from clever_gesinen.device_info where device_id ='"+deviceId+"';",function(err,data){
		
		result = JSON.stringify(data);
		result = JSON.parse(result);		
		if(result.length>0)
		{
			for(var i=0;i<result.length;i++){
				var deviceId = result[i].device_id;
				var latitude = result[i].latitude;
				var longitude = result[i].longitude;				
				var datetime = getDateTime();				
				var date =  new Date(datetime);				
				var times = SunCalc.getTimes(date, latitude, longitude);				
				var sunrisehour =('0'+ ((times.sunrise.getHours())+2)).slice(-2);
				var sunriseminute = ('0'+(times.sunrise.getMinutes())).slice(-2);
				var sunsethour = ('0'+((times.sunset.getHours())+2)).slice(-2);
				var sunsetminute = ('0'+(times.sunset.getMinutes())).slice(-2);				
				 sunriseStr = ((times.sunrise.getHours()) * 60)  +  times.sunrise.getMinutes();				
				 sunsetStr = ((times.sunset.getHours())*60) +  times.sunset.getMinutes();				
			}
			console.log('latitude='+ latitude);
			console.log('longitude='+ longitude);
			console.log('sunriseStr='+ sunriseStr);
			console.log('sunsetStr='+ sunsetStr);
		}
				});*/
				
			}
			
		}
		});
		connection.release();
		
		
});

		
});

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

function getHoursAndMinuteOfCurrentTime() {
    var currentTime     = calcTime('Madrid','+1');//new Date(); 
	var now =  new Date(currentTime);
   
    var hour    = now.getHours();
    var minute  = now.getMinutes();       
   
    var dateTime = (hour * 60 ) + minute;   
     return dateTime;
}

function getTheDayOfToday() {
  var currentTime     = calcTime('Madrid','+1');//new Date(); 
  var now =  new Date(currentTime);
  var weekday = new Array(7);
  weekday[0] = "Sun";
  weekday[1] = "Mon";
  weekday[2] = "Tue";
  weekday[3] = "Wed";
  weekday[4] = "Thu";
  weekday[5] = "Fri";
  weekday[6] = "Sat";

  var n = weekday[now.getDay()];
 // document.getElementById("demo").innerHTML = n;
 return n;
}