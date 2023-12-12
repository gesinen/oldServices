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

	console.log('start');
	async function main(){
		 processThePDFGenerationPDFKit();
		 processThePDFGenerationPDFKit2();
		}
main();

// Process thePDF generation
  async function processThePDFGenerationPDFKit() {
	  // Create a document
		const doc = new PDFDocument();
		
		let date = new Date().toJSON();
		let datepart = date.split(".");
		console.log(datepart[0]); // 2022-06-17T11:06:50.369Z
		
		// Saving the pdf file in root directory.
		
		 let filename = '/var/www/html/swat-gesinen/dist/pdfFiles/test.pdf';
		 const fileCreate =  fs.createWriteStream(filename, { mode: 0777 })
		doc.pipe(fileCreate);
		fileCreate.on('finish',async ()=>{
			fs.chmodSync(filename, 0o777);
		});
		
		
  
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
  
  // Process thePDF generation
  async function processThePDFGenerationPDFKit2() {
	  // Create a document
		const doc = new PDFDocument();
		
		let date = new Date().toJSON();
		let datepart = date.split(".");
		console.log(datepart[0]); // 2022-06-17T11:06:50.369Z
		
		// Saving the pdf file in root directory.
		
		 let filename = '/var/www/html/swat-gesinen/dist/pdfFiles/test1.pdf'
		const fileCreate =  fs.createWriteStream(filename, { mode: 0755 })
		doc.pipe(fileCreate);
		fileCreate.on('finish',async ()=>{
			fs.chmodSync(filename, 0o755);
		});;
		
  
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
