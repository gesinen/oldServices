var mqtt    = require('mqtt');
var btoa = require('btoa');
var client  = mqtt.connect('mqtt://82.223.50.35');  
var schedule = require('node-schedule');
var db = require('./database/clever_db');
var nodemailer = require('nodemailer');
var smtpConfig = {
    host: 'smtp.1and1.es',
    port: 587,
    //secure: true, // use SSL
    auth: {
        user: 'no-reply@gesinen.es',
        pass: 'Team@1234'
    }
};
var transporter = nodemailer.createTransport(smtpConfig);
 

var j = schedule.scheduleJob('*/5 * * * *', function(){
	db.getConnection(function(err,connection){
		var sql = "SELECT DISTINCT device_id FROM clever_gesinen.device_info where device_status = 1";
		console.log('Start schedule....');
		connection.query(sql,function(err,data){
		connection.release();
		result = JSON.stringify(data);
		result = JSON.parse(result);				
		if(result.length>0)
			{
			for(var i=0;i<result.length;i++){				
				var items  = [103,108];
				deviceId = result[i].device_id;
				var s = btoa(String.fromCharCode.apply(null, items));
				//if(deviceId == '0079e129d522e562' || deviceId == '0079e129d522e561')
			//	{}
			//else{
				client.publish('application/1/device/'+deviceId+'/tx', '{"confirmed":true,"fPort": 10,"data":"'+s+'"}');
			//}
				}
			}
});
	});				
	
});
					
