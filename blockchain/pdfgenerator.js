const schedule = require('node-schedule');
const asyncLoop = require('node-async-loop');
const mysql = require('mysql');
const PDFDocument = require('pdfkit');
const PDFDocumentTableKit = require('pdfkit-table');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');

const fs = require('fs');
var request = require('request');
var axios = require('axios');


// Database
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
	password:'sWatid2022#',
    //password: 'Al8987154St12',
    //password: '',
    //database: 'swat_gesinen'
	database:'gomera_database'
});
// Asynchronous mysql query
async function query(sql) {
    return new Promise((resolve, reject) => {

        db.getConnection(function(err, connection) {

            if (err) {
                reject(err)
            } else {
                connection.query(sql, (err, rows) => {

                    if (err) {
                        reject(err)
                    } else {
                        resolve(rows)
                    }
                    // finaliza la sesión
                    connection.release()
                })
            }
        })
    })
}
console.log('file execution');
var j = schedule.scheduleJob('*/2 * * * *', async function(){
	console.log('start');
	async function main(){
		//console.log('main');
		const config = await getconfigjsonInfo();
		const list = await getAllAutomaticGenerationList();
		//console.log('list',list);
		if(list['automatic_genrator'].length > 0){
			let deviceArray =[];
		//list['automatic_genrator'].forEach( async (element) => {
			asyncLoop(list['automatic_genrator'], async function(element, next) {
				
      try {
		    
		  let date = new Date().toJSON();
		  let datepart = date.split(".");
		  let date2 = new Date(datepart[0]);
		  let date1 = new Date(element.pdf_generation_datetime == null ? element.startingdate : element.pdf_generation_datetime);
		  let diffTime = Math.abs(date2 - date1);
		  let hours = ((diffTime/(1000 * 60 * 60)));
		  console.log('date',date2,date1);
		  console.log('hours',hours,parseInt(element.periodicity));
		  //console.log('element',element);
		  if(hours > parseInt(element.periodicity) && element.status == 'online'){
			  
		  
		  let  Blockchaindevices = JSON.parse(element.devices);
		 // asyncLoop(Blockchaindevices, async function(device, next) {
			 
			 //console.log(Blockchaindevices);
			 for( var device in Blockchaindevices){
		  //console.log('deviceName',Blockchaindevices[device].deviceName,date1,date2);
		  if(element.valuetype == 'lastValue'){
			 // this is called for last value only
		   let deviceInfo = await getObservationFromEventUp(Blockchaindevices[device].deviceName);//await getGenericDeviceObservation(device.deviceId);
		  deviceArray.push(deviceInfo[0]);
		  }else{
			  // this is calle for period value
			  let deviceInfo = await getObservationForPeriodFromEventUp(Blockchaindevices[device].deviceName,date1,date2);
			//console.log('deviceInfo',deviceInfo);
			if(deviceInfo != null){
			deviceInfo.forEach( async (device) => {
				deviceArray.push(device);
			});
			}
			
		  }
		  //console.log('deviceInfo',deviceInfo[0]);
			 //deviceArray.push(deviceInfo[0]);
			 }
		 // next();
		  //});
		  let  xtoken = config["x-token"];//'test';
		  console.log('xtoken',xtoken);
		 // console.log('deviceArray',deviceArray);
		   let accountBalaceBefore = 0;
		   // get the account balance before the transction
		  accountBalaceBefore = await getAccountBalanceOnBlockchain(xtoken);
		  console.log('accountBalaceBefore',accountBalaceBefore)
		  // this is to create the table on pdf;
		  console.log('deviceArray length',deviceArray.length,deviceArray[0]);
		  if(deviceArray.length > 0){
		  let fileGenerated = await processThePDFGenerationPDFkitTable(element,deviceArray);
		  
		 
		  console.log('hash',fileGenerated);
		  if(fileGenerated.status == 'Success'){
			 
			 let  txid = 0;
			 let accountBalaceAfter = 0;
			
			  
			  // create the asset in blockchain
			 txid = await createAssetOnBlockchain(fileGenerated.filename,fileGenerated.hash,xtoken);
			  console.log('txid',txid);
			  
			  // add delay for 7 sec because blockchain take  some time to insert the block.
			  await new Promise(resolve => setTimeout(resolve, 7000));
			  
			 // find the asset just created 7 sec ago.
			  let assets = await findAssetOnBlockchain(fileGenerated.filename,fileGenerated.hash,xtoken);
			  console.log('assets',assets);
			  // account balance after transaction
			  accountBalaceAfter = await getAccountBalanceOnBlockchain(xtoken);
			 // console.log('accountBalaceAfter',accountBalaceAfter,txid,assets[0]['asset-id']);
			  // calculate the transaction cost
			  let cost  = (accountBalaceBefore - accountBalaceAfter);
			  
			  
			 let filepath = '/pdfFiles/';
			 let walletName = '';
			 // insert the record in database
			 if(txid == 0){
				 if(config["x-token"] == 'test'){
					 walletName = 'test';
				 }
				 else{
					walletName = 'prod'; 
				 }
				 let insertRecord =  await insertFileAndHashInDB(filepath,fileGenerated.filename,fileGenerated.hash,element.name,fileGenerated.pdfGenerationTime,element.devices,'pending','pending','pending','pending','pending','pending',element.user_id,walletName);
				console.log('insert Detail',insertRecord);
				//update the pdf generation datetime
			 await updateAutoGeneratedPdfDatetime(element.id,fileGenerated.pdfGenerationTime);
				 
			 }
			 else{
				 if(config["x-token"] == 'test'){
					 walletName = 'test';
				 }
				 else{
					walletName = 'prod'; 
				 }
			  let insertRecord =  await insertFileAndHashInDB(filepath,fileGenerated.filename,fileGenerated.hash,element.name,fileGenerated.pdfGenerationTime,element.devices,txid.tx_id,cost,assets[0]['created-at-round'],assets[0]['asset-id'],accountBalaceBefore,accountBalaceAfter,element.user_id,walletName);
				console.log('insert Detail',insertRecord);
				//update the pdf generation datetime
			 await updateAutoGeneratedPdfDatetime(element.id,fileGenerated.pdfGenerationTime);
			 }
		  }
		  }
		  
		  // this is create text and image on pdf
        //processThePDFGenerationPDFKit(element);
		  next();
		  }
		  else{
			 next(); 
		  }
      } catch (error) {
        console.log("[ERROR]: ", error);
		next();
      }
			
    });
		}
}
main();
});

// geting All Automatic generation list scheduled
async  function getAllAutomaticGenerationList() {var options = {
            'method': 'GET',
            'url': 'http://192.168.60.51/v2/blockchain/pdfgeneration',//'https://stage.swat-id.gesinen.com/v2/blockchain/pdfgeneration', //'http://localhost:8080/v2/boiler/devices/service/info',
            'headers': {
                'Content-Type': 'application/json'
            }
	};
	return new Promise(function(resolve, reject){
		request(options, function (error, response, body) {
			if (error) return reject(error);
			try {
                // JSON.parse() can throw an exception if not valid JSON
			//	console.log(body);
                resolve(JSON.parse(body));
            } catch(e) {
                reject(e);
            }
		});
	});
	
}

// geting balace from blockchain
async  function getAccountBalanceOnBlockchain(xtoken) {var options = {
            'method': 'GET',
            'url': 'http://localhost:8000/account_balance',
            'headers': {
                'Content-Type': 'application/json',
				'x-token':xtoken
            }
	};
	return new Promise(function(resolve, reject){
		request(options, function (error, response, body) {
			if (error) return reject(error);
			try {
                // JSON.parse() can throw an exception if not valid JSON
			//	console.log(body);
                resolve(JSON.parse(body));
            } catch(e) {
                reject(e);
            }
		});
	});
	
}
// find the asset on block chain
async  function findAssetOnBlockchain(filename,hashstring,xtoken){
	var options = {
            'method': 'GET',
            'url': 'http://localhost:8000/find_asset?fileName='+filename+'&hash='+hashstring,
            'headers': {
                'Content-Type': 'application/json',
				'x-token':xtoken
            }
	};
	//console.log('option',options)
	return new Promise(function(resolve, reject){
		request(options, function (error, response, body) {
			if (error) return reject(error);
			try {
                // JSON.parse() can throw an exception if not valid JSON
				//console.log('asset',body);
                resolve(JSON.parse(body));
            } catch(e) {
                reject(e);
            }
		});
	});
	
	
}

// create asset on  blockchain
async  function createAssetOnBlockchain(filename,hashstring,xtoken) {var options = {
            'method': 'POST',
            'url': 'http://localhost:8000/create_asset',
            'headers': {
                'Content-Type': 'application/json',
				'x-token':xtoken
            },
		body: JSON.stringify({
			"fileName": filename,
			"hashString": hashstring
		})
	};
	return new Promise(function(resolve, reject){
		request(options, function (error, response, body) {
			if (error) return reject(error);
			try {
                // JSON.parse() can throw an exception if not valid JSON
				//console.log(body);
                resolve(JSON.parse(body));
            } catch(e) {
                reject(e);
            }
		});
		
		// testing axios but not working
	/*	axios(options).then(function (response) {
  //console.log(JSON.stringify(response.data));
  resolve(JSON.parse(response.data));
})
.catch(function (error) {
	reject(error);
  console.log(error);
});
*/
	});
	
}
 async function getGenericDeviceObservation(id) {
	let getQuery = "SELECT generic_define_device.*,gdv.id as variableId,gdv.variable_name,gdv.variable_unit,gdv.variable_varname,gdv.variable_type,gdv.last_observation,gdv.observation_time,sensor_info.name  as sensorName, sensor_info.device_eui as deviceEUI  FROM generic_define_device inner join generic_device_variables  as gdv on generic_define_device.id = gdv.generic_device inner join sensor_info on sensor_info.id = generic_define_device.sensor_id WHERE generic_define_device.id = "+id;
    let res = await query(getQuery)
    //console.log("res", res)
    return res;
    
}

async function getObservationFromEventUp(device_name) {
	var options = {
            'method': 'POST',
            'url': 'http://192.168.60.51/v2/blockchain/pgDeviceObjectsByNameLastValueEventup',
            'headers': {
                'Content-Type': 'application/json'
				
            },
		body: JSON.stringify({
			"device_name": device_name
		})
	};
	return new Promise(  function(resolve, reject){
		 request(options, function (error, response, body) {
			if (error) return reject(error);
			try {
                // JSON.parse() can throw an exception if not valid JSON
				//console.log(body);
                resolve(JSON.parse(body));
            } catch(e) {
                reject(e);
            }
		});
	})
    
}
// this method return the period values of selected stating date and end date
async function getObservationForPeriodFromEventUp(device_name,startTime,endTime) {
	var options = {
            'method': 'POST',
            'url': 'http://192.168.60.51/v2/blockchain/pgDeviceObjectsByNamePeriodValueEventup',
            'headers': {
                'Content-Type': 'application/json'
				
            },
		body: JSON.stringify({
			"device_name": device_name,
			"start_time":startTime,
			"end_time":endTime
		})
	};
	return new Promise(  function(resolve, reject){
		 request(options, function (error, response, body) {
			if (error) return reject(error);
			try {
                // JSON.parse() can throw an exception if not valid JSON
				//console.log('period value',body);
				if(!body){
					resolve(null);
				}
                resolve(JSON.parse(body));
            } catch(e) {
                reject(e);
            }
		});
	})
    
}

// this method read the config.json data
async function getconfigjsonInfo() {
	var options = {
            'method': 'POST',
            'url': 'http://192.168.60.51/v2/blockchain/readfromfile',
            'headers': {
                'Content-Type': 'application/json'
				
            },
		body: JSON.stringify({
			"fileName": 'config.json',
			
		})
	};
	return new Promise(  function(resolve, reject){
		 request(options, function (error, response, body) {
			if (error) return reject(error);
			try {
                // JSON.parse() can throw an exception if not valid JSON
				//console.log('period value',body);
				
                resolve(JSON.parse(body));
            } catch(e) {
                reject(e);
            }
		});
	})
    
}

/*async function insertFileAndHashInDB(file_path,filename,hash,name,sensor_name,datetime_of_pdf,generic_device_id,sensor_id,device_name,user_id) {
	let insertQuery = "Insert into blockchain_history (file_path,filename,hash,name,sensor_name,datetime_of_pdf,generic_device_id,sensor_id,device_name,user_id) value ('"+file_path+"','"+filename+"','"+hash+"','"+name+"','"+sensor_name+"','"+datetime_of_pdf+"',"+generic_device_id+","+sensor_id+",'"+device_name+"',"+user_id+")";
    let res = await query(insertQuery)
    //console.log("res", res)
    return res;
    
}*/

async function insertFileAndHashInDB(file_path,filename,hash,name,datetime_of_pdf,sensor_name,transaction_id,cost,datetime_transaction,asset_id,accountBalanceBefore,AccountBalanceAfter,user_id,walletName) {
	let insertQuery = "Insert into blockchain_history (file_path,filename,hash,name,datetime_of_pdf,sensor_name,transaction_id,cost,datetime_transaction,asset_id,balance_before_transaction,balance_after_transaction,user_id,walletName) value ('"+file_path+"','"+filename+"','"+hash+"','"+name+"','"+datetime_of_pdf+"','"+sensor_name+"','"+ transaction_id +"',"+cost+","+datetime_transaction+","+asset_id+",'"+accountBalanceBefore+"','"+AccountBalanceAfter+"',"+user_id+",'"+walletName+"')";
    let res = await query(insertQuery)
    //console.log("res", res)
    return res;
    
}


async function updateAutoGeneratedPdfDatetime(id,datetime_of_pdf) {
	let updateQuery = "update blockchain_generator_info set pdf_generation_datetime = '"+datetime_of_pdf+"' where id = "+id;
    let res = await query(updateQuery)
    //console.log("res", res)
    return res;
    
}


async function processThePDFGenerationPDFkitTable(blockchain,deviceList){
	return new Promise( async function(resolve, reject){
	let doc = new PDFDocumentTableKit({ margin: 30, size: 'A4' });
	// save document
	let date = new Date().toJSON();
		let datepart = date.split(".");
		console.log(datepart[0]); // 2022-06-17T11:06:50.369Z
		let dateInName = datepart[0].replace(/:/g,"_");
		
		// Saving the pdf file in root directory.
		// let name = (deviceList[0].name).replace(/ /g,"_");
		//console.log('blockchain device list',blockchain,deviceList)
		 let sensorId = blockchain.name;//deviceList[0].sensor_id;
		 let name = '_'+dateInName+'.pdf';
		 //console.log('dirname',__dirname);
		 let filename = '/var/www/html/swat-gesinen/dist/pdfFiles/'+name;
		 const fileCreate =  fs.createWriteStream(filename, { mode: 0777 });
  doc.pipe(fileCreate);
  // await createTable(doc,blockchain,deviceList);
  await createTableNew(doc,blockchain,deviceList);

   fileCreate.on('finish',async ()=>{
	   let filebuffer = await readTheFileBuffer(filename);//await calculateHash(filename);
	   //console.log(filebuffer);
	   fs.chmodSync(filename, 0o744);
	  let Hash = await CreateTheHash(filebuffer);//await calculateHash(filename);
	  console.log('hash',Hash);
	  if(Hash){
		  resolve({
				http: 200,
				status: "Success",
				hash: Hash,
				filename:name,
				pdfGenerationTime:datepart[0]
			});
		}
		else{
			reject({
              http: 401,
              status: "Failed",
              error: 'No hash created',
            });
		}
  });
  
	});
 
}

async function createTableNew(doc,blockchain,deviceList){
    // table
	let rows = [];
	//let columnsizearray = [];
	deviceList.forEach(item=>{
		
	});
	
	let headerVal = Object.keys(deviceList[0].object);
	console.log(headerVal)
	
	/*headerVal.forEach(i=>{
		columnsizearray.push(100);
	});*/
	let deviceEUI = '';
	deviceList.forEach(item=>{
		if(item.object != null) {
		 
		let val_array =[];
		headerVal.forEach(key=>{
			if(item.object[key] == undefined){
				val_array.push('NA')
			}
			else{
			val_array.push(item.object[key]);
			}
		})
		if(deviceEUI == item.dev_eui){
			val_array.push('' , item.time);
		}
		else{
		val_array.push(item.device_name , item.time);
		}
		deviceEUI = item.dev_eui;
		//let data  = Object.values(item.object);
		
		rows.push(val_array);
	}
	});
	headerVal.push("deviceName","Datetime");
	//console.log('headers',headerVal);
	//console.log(rows);
     const table = {
      title: blockchain.name,
      subtitle: blockchain.name,
      headers: headerVal,
	  rows: rows,
    };
	// A4 595.28 x 841.89 (portrait) (about width sizes)
    // width
    await doc.table(table, { 
      width: 550,
    });
    // or columnsSize
    /*await doc.table(table, { 
      columnsSize: columnsizearray,//[ 200, 100, 50,50,100 ],
    });*/
    // done!
    doc.end();
	
	 }

async function createTable(doc,blockchain,deviceList){
    // table
	let rows = [];
	deviceList.forEach(item=>{
		
		let observation_time = item.observation_time != null ? (item.observation_time.toJSON()).split("."):['No Observation'];
		let variable_unit = item.variable_unit == ""?"No Unit":item.variable_unit;
		 let lastObservation = item.last_observation != null ? item.last_observation:'No observation';
		 let data = [item.sensorName , item.variable_name, lastObservation,variable_unit,observation_time[0]];
		rows.push(data);
	});
	//console.log(rows);
     const table = {
      title: deviceList[0].name,
      subtitle: blockchain.name,
      headers: [ "SensorName", "VariableName", "Value", "Unit", "DateTime" ],
	  rows: rows,
    };
	// A4 595.28 x 841.89 (portrait) (about width sizes)
    // width
    //await doc.table(table, { 
    //  width: 300,
    //});
    // or columnsSize
    await doc.table(table, { 
      columnsSize: [ 200, 100, 50,50,100 ],
    });
    // done!
    doc.end();
	
	 }

// Process thePDF generation
  async function processThePDFGenerationPDFKit(element) {
	  // Create a document
		const doc = new PDFDocument();
		
		let date = new Date().toJSON();
		let datepart = date.split(".");
		console.log(datepart[0]); // 2022-06-17T11:06:50.369Z
		
		// Saving the pdf file in root directory.
		 let filename = 'pdfFiles/'+element.name+ datepart[0]+'.pdf'
		doc.pipe(fs.createWriteStream(filename));
  
		// Adding functionality
		doc
		.fontSize(27)
		.text('This the article for GeeksforGeeks', 100, 100);
		
		// Adding an image in the pdf.
  
		  /*doc.image('download3.jpg', {
			fit: [300, 300],
			align: 'center',
			valign: 'center'
		  });*/
		  
		  doc
		  .addPage()
		  .fontSize(15)
		  .text('Generating PDF with the help of pdfkit', 100, 100);
		  
		// Apply some transforms and render an SVG path with the 
		// 'even-odd' fill rule
		doc
		  .scale(0.6)
		  .translate(470, -380)
		  .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
		  .fill('red', 'even-odd')
		  .restore();
		   
		// Add some text with annotations
		doc
		  .addPage()
		  .fillColor('blue')
		  .text('The link for GeeksforGeeks website', 100, 100)
			
		  .link(100, 100, 160, 27, 'https://www.geeksforgeeks.org/');
		   
		// Finalize PDF file
		doc.end();
	  
	  
  }
  
  async  function calculateHash(path) {
	
  //console.log( '/var/www/html/swat-gesinen/dist/test/'+path);
  let file_buffer = fs.readFileSync(path);
  //console.log('buffer',file_buffer);
  let sum = crypto.createHash('sha256');
  sum.update(file_buffer);
  const hex = sum.digest('hex');
  return hex;
}

async  function readTheFileBuffer(path) {
	
  //console.log( '/var/www/html/swat-gesinen/dist/test/'+path);
  let file_buffer = fs.readFileSync(path,{ encoding: 'utf8', flag: 'r' });
  //console.log('file buffer',file_buffer);
  return file_buffer;
  //return CryptoJS.SHA256(file_buffer).toString();
}

async  function CreateTheHash(file_buffer) {
	//console.log(file_buffer);
  //console.log( '/var/www/html/swat-gesinen/dist/test/'+path);
  //let file_buffer = fs.readFileSync(path);
  return CryptoJS.SHA256(file_buffer).toString();
}