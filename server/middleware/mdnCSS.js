'use strict';
const cheerio = require( 'cheerio' );
const request = require( 'request' );
const fs = require( 'fs' );
const targz = require( 'tar.gz' );
const zlib = require( 'zlib' );
const path = require( 'path' );
const tar = require( 'tar' );
const archiver = require( 'archiver' );
const folderHandler = require('./folderHandler');


let mdnCSS = {
	/*
	* This function goes to kapeli.com, grabs the Javascript link,
	* then attaches it to the req obj
	*/
	download: function ( req, res, next ) {
		request( 'https://kapeli.com/mdn_offline', function ( err, html ) {
			if ( err ) console.log( err );
			let $ = cheerio.load( html.body );

			//Only use the link that contains the text 'Javascript.tgz'
			let CSSdownloadLink = "https://kapeli.com/" + $( ".download:contains('CSS.tgz')" )
				.attr( "href" );
			req.CSSdownloadLink = CSSdownloadLink;
			next();
		} );
	},
	//downloads tar file from kapeli.com
	getCSS: function ( req, res, next ) {
		//NOTE:downloading 22 MB .tar to disk

		let write = fs.createWriteStream( './temp/CSS.tgz' );

		///////////////////////////////////////////////////////
		// using the request stream as a ReadStream
		// NOTE: req.CSSdownloadLink initialized in mdn.download
		//////////////////////////////////////////////////////
		let read = request( req.CSSdownloadLink )
			.on( 'error', function ( err ) {
				throw err;
			} )
			.pipe( write );

		//just to log bytes written - not necessary
		let watcher = fs.watch( './temp/CSS.tgz' )
			.on( 'change', function () {
				let bytes=(read.bytesWritten/1000000).toFixed(2);
				require('single-line-log').stdout('CSS: ',bytes +' MB');
			});
		//close readStream and watcher
		read.on( 'finish', function () {
			read.close( function(){
				watcher.close();
				next();
			});
		} );
	},
	extract: function ( req, res, next ) {
		console.log( 'extracting...' );
		let inflate = zlib.Unzip();
		let extractor = tar.Extract( {
				path: './docs/mdn/css/documents'
			} )
			.on( 'error', function ( err ) {
				throw err;
			} )
			.on( 'end', function () {
				console.log( 'extracted' );
				next();
			} );
		let extracting = fs.createReadStream( './temp/CSS.tgz' )
			.on( 'error', function ( err ) {
				throw err;
			} )
			.pipe( inflate )
			.pipe( extractor );
		extracting.on( 'finish', function () {
			// next();
		} );
	},
	getObjs: function(req, res, next){
		let base = 'CSS/developer.mozilla.org/en-US/docs/Web/CSS/';
		let $ = cheerio.load(fs.readFileSync('./docs/mdn/css/documents/CSS/developer.mozilla.org/en-US/docs/Web/CSS/Reference.html'));
		let classObj = {};
		let elemObj = {};
		let funcObj = {};
		let typesObj = {};
		let propObj = {};
		let guideObj = {};
		$('div .index a').each((i, el) => {
			let text = $(el).text();
			let link = $(el).attr('href');
			let classReg = new RegExp (/^:[^:].+/g );
			let elemReg = new RegExp (/^::/g );
			let funcReg = new RegExp (/^@|\(\)$/g );
			let typeReg = new RegExp (/^</g );
			if(classReg.test(text)){
				classObj[text]= base + link;
			}
			else if(elemReg.test(text)){
				elemObj[text] = base + link;
			}
			else if(funcReg.test(text)){
				funcObj[text] = base + link;
			}
			else if ( typeReg.test(text)){
				typesObj[text] = base + link;
			}else{
				propObj[text] = base + link;
			}
		});
		$('div.column-half li a').each((i, el) => {
			guideObj[$(el).text()] = base + $(el).attr('href');
		});
		req.classObj = classObj;
		req.elemObj = elemObj;
		req.funcObj = funcObj;
		req.typesObj = typesObj;
		req.propObj = propObj;
		req.guideObj = guideObj;
		next();
	},
	getMoz : function(req, res, next){
		let base = 'CSS/developer.mozilla.org/en-US/docs/Web/CSS/';
		let $ = cheerio.load(fs.readFileSync('./docs/mdn/css/documents/CSS/developer.mozilla.org/en-US/docs/Web/CSS/Mozilla_Extensions.html'));

		$('div .index a').each((i, el) => {
			let text = $(el).text();
			let link = $(el).attr('href');
			let classReg = new RegExp (/^:[^:].+/g );
			let elemReg = new RegExp (/^::/g );
			if(classReg.test(text)){
				req.classObj[text] = base + link;
			}
			if(elemReg.test(text)){
				req.elemObj[text] = base + link;
			}
		});
		next();
	},
	sqlFile: function ( req, res, next ) {
		let i = 0;
		let jsonIndex = {"sourceName": req.scrapeProps.sourceName,
				"versionNo": req.scrapeProps.versionNo, "result": []};
		let objects = {
			Classes:req.classObj ,
			Elements:req.elemObj,
			Functions:req.funcObj ,
			Types:req.typesObj ,
			Properties:req.propObj,
		  Guides:req.guideObj
		};
		req.classObj = null;
		req.elemObj = null;
		req.funcObj = null;
		req.typesObj = null;
		req.propObj = null;
		req.guideObj = null;
		for ( let k in objects ) {
			// console.log( k );
			for ( let j in objects[ k ] ) {
				jsonIndex.result.push({"NAME": j, "TYPE": k, "LINK": objects[k][j]});
			}
		}
		jsonIndex = JSON.stringify(jsonIndex);
		fs.writeFileSync( "docs/mdn/css/index.json", jsonIndex );
		//Null out jsonIndex
		jsonIndex = null;
		next();
	},
	zip: function ( req, res, next ) {
		let output = fs.createWriteStream( 'zips/mdn/mdn_css'+req.scrapeProps.versionNo+'.zip');
		let archive = archiver('zip');
		req.scrapeProps.filePath = './zips/mdn/mdn_css'+req.scrapeProps.versionNo+'.zip';
		output.on('close', function() {
			fs.unlink('./temp/HTML.tgz', (err) => {
				//Null out jsonindex and req stuff
				req.classObj = null;
				req.elemObj = null;
				req.funcObj = null;
				req.typesObj = null;
				req.propObj = null;
				req.guideObj = null;
		  		console.log(archive.pointer() + ' total bytes');
				folderHandler.deleteFolderRecursive(req.scrapeProps.baseDir);
		  		console.log('archiver has been finalized and the output file descriptor has closed.');
				next();
			});
		});

		archive.on('error', function(err) {
		  throw err;
		});

		archive.pipe(output);

		archive.bulk([
		  { expand: true, cwd: 'docs/mdn/css/', src: ['**'], dest:'mdn_css.docs' }
		]);

		archive.finalize();
	}
};


module.exports = mdnCSS;
