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
async function main(){
		//console.log('main');
		const list = await getAllTheTransactionIsPending();
		//console.log('list',list);
		if(list.length > 0){
			let deviceArray =[];
		//list['automatic_genrator'].forEach( async (element) => {
			asyncLoop(list, async function(element, next) {
				
      try {
		    
		  let  xtoken = 'test';
		 
		   let accountBalaceBefore = 0;
		   
		  accountBalaceBefore = await getAccountBalanceOnBlockchain(xtoken);
		  console.log('accountBalaceBefore',accountBalaceBefore)
		  
			 
			 let  txid = 0;
			 let accountBalaceAfter = 0;
			
			  
			  // create the asset in blockchain
			 txid = await createAssetOnBlockchain(element.filename,element.hash,xtoken);
			  console.log('txid',txid);
			  
			  // add delay for 7 sec because blockchain take  some time to insert the block.
			  await new Promise(resolve => setTimeout(resolve, 7000));
			  
			 // find the asset just created 7 sec ago.
			  let assets = await findAssetOnBlockchain(element.filename,element.hash,xtoken);
			  console.log('assets',assets);
			  // account balance after transaction
			  accountBalaceAfter = await getAccountBalanceOnBlockchain(xtoken);
			 // console.log('accountBalaceAfter',accountBalaceAfter,txid,assets[0]['asset-id']);
			  // calculate the transaction cost
			  let cost  = (accountBalaceBefore - accountBalaceAfter);
			  
			  
			 let filepath = '/pdfFiles/';
			 // insert the record in database
			 if(txid != 0){
				 let update =  await updateTheHistoryTable(element.id,txid.tx_id,cost,assets[0]['created-at-round'],assets[0]['asset-id'],accountBalaceBefore,accountBalaceAfter,element.user_id);
				console.log('update History',update);
				}
		
		  next();
		  }
		  
      catch (error) {
        console.log("[ERROR]: ", error);
		next();
      }
	  
	});
		}
}
main();

async function updateTheHistoryTable(element.id,txid,cost,datetime_transaction,asset_id,accountBalaceBefore,accountBalaceAfter,element.user_id){
	let updateQuery = "update blockchain_history set transaction_id = '"+txid+"' , cost ="+cost+" , datetime_transaction ="+asset_id+", balance_before_transaction = '"+accountBalaceBefore+"', balance_after_transaction = '"+accountBalaceAfter+"' where id = "+id;
    let res = await query(updateQuery)
    //console.log("res", res)
    return res;
}

 async function getAllTheTransactionIsPending() {
	let getQuery = "SELECT *  FROM blockchain_history where transaction_id = 'pending'";
    let res = await query(getQuery)
    //console.log("res", res)
    return res;
    }
// create asset on  blockchain
async  function createAssetOnBlockchain(filename,hashstring,xtoken) {
	console.log('createAsset',filename,hashstring,xtoken);
	var options = {
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
				console.log(body);
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
	console.log('option',options)
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
