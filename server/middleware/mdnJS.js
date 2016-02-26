'use strict'
const cheerio = require( 'cheerio' );
const request = require( 'request' );
const fs = require( 'fs' );
const zlib = require( 'zlib' );
const path = require( 'path' );
const tar = require( 'tar' );
const archiver = require( 'archiver' );
const folderHandler = require('./folderHandler');

let mdnJS = {

	/*
	* This function goes to kapeli.com, grabs the Javascript link,
	* then attaches it to the req obj
	*/

	download: function ( req, res, next ) {
		request( 'https://kapeli.com/mdn_offline', function ( err, html ) {
			if ( err ) console.log( err );
			let $ = cheerio.load( html.body );
			var d = new Date();
			console.log("requesting  ", d.getMinutes(), ":", d.getSeconds());
			//Only use the link that contains the text 'Javascript.tgz'
			let downloadLink = "https://kapeli.com/" + $( ".download:contains('JavaScript.tgz')" )
				.attr( "href" );
			// req.downloadLink = downloadLink;
			req.downloadLink = 'http://localhost:8080/js2';
			next();
		} );
	},
	//downloads tar file from kapeli.com
	getJavascript: function ( req, res, next ) {
		//downloading 116 MB .tar to disk

		//Check if js file exists

		let write = fs.createWriteStream( './temp/JavaScript.tgz' );
		var d = new Date();
		console.log("Downloading  ", d.getMinutes(), ":", d.getSeconds());
		///////////////////////////////////////////////////////
		// using the request stream as a ReadStream
		// NOTE: req.downloadLink initialized in mdn.download
		//////////////////////////////////////////////////////
		let read = request( req.downloadLink )
			.on( 'error', function ( err ) {
				throw err;
			} )
			.pipe( write );

		//just to log bytes written - not necessary
		// let watcher = fs.watch( './temp/JavaScript.tgz' )
		// 	.on( 'change', function () {
		// 		let bytes=(read.bytesWritten/1000000).toFixed(2);
		// 		// console.log( bytes +' MB');
		// 		require('single-line-log').stdout(bytes +' MB')
		// 	} );
		//close readStream and watcher
		read.on( 'finish', function () {
			read.close( function(){
				console.log("done  ", d.getMinutes(), ":", d.getSeconds());
				// watcher.close();
				// res.send("DONE")
				next();
			});
		} );
	},
	extract: function ( req, res, next ) {
		console.log( 'extracting...' );
		var d = new Date();
		console.log("extracting  ", d.getMinutes(), ":", d.getSeconds());
		let inflate = zlib.Unzip();
		let extractor = tar.Extract( {
				path: './docs/mdn/javascript/documents'
			} )
			.on( 'error', function ( err ) {
				throw err;
			} )
			.on( 'end', function () {
				console.log( 'extracted' );
				next();
			} );
		let extracting = fs.createReadStream( './temp/JavaScript.tgz' )
			.on( 'error', function ( err ) {
				throw err;
			} )
			.pipe( inflate )
			.pipe( extractor );
		extracting.on( 'finish', function () {
			// next();
		} );
	},
	createClassObj: function ( req, res, next ) {
		let base = 'JavaScript/developer.mozilla.org/en-US/docs/Web/API/';
		let classObj = {};
		var d = new Date();
		console.log(d.getMinutes(), d.getSeconds());
		fs.readdir( './docs/mdn/javascript/documents/' + base, function ( err, files ) {
			if ( err ) console.log( err );
			// console.log(files);
			files = files.filter( elem => {
				return elem.includes( '.html' );
			} );
			for ( let k of files ) {
				classObj[ k.replace( '.html', "" ) ] = base + k;
			}
			req.classObj = classObj;
			next();
		} );
	},
	createMethodsObj: function ( req, res, next ) {
		function getDirectories( srcpath ) {
			return fs.readdirSync( srcpath )
				.filter( function ( file ) {
					return fs.statSync( path.join( srcpath, file ) )
						.isDirectory();
				} );
		}
		let base = 'JavaScript/developer.mozilla.org/en-US/docs/Web/API';
		let methodObj = {};

		let directories = getDirectories( './docs/mdn/javascript/documents/' + base );

		directories.forEach( elem => {
			fs.readdir( `docs/mdn/javascript/documents/${base}/${elem}`, function ( err, files ) {
				// console.log(files, err)
				files.forEach( fileElem => {
					let key = `${elem}.${fileElem}`;
					methodObj[ key.replace( ".html", "" ) ] = `${base}/${elem}/${fileElem}`;
				} );
				req.methodObj = methodObj;
			} );
		} );
		next();
	},
	createEventObj: function ( req, res, next ) {
		let base = 'JavaScript/developer.mozilla.org/en-US/docs/Web/Events/';
		let eventsObj = {};

		fs.readdir( './docs/mdn/javascript/documents/' + base, function ( err, files ) {
			if ( err ) console.log( err );
			files = files.filter( elem => {
				return elem.includes( '.html' );
			} );
			for ( let k of files ) {
				eventsObj[ k.replace( '.html', "" ) ] = base + k;
			}
			req.eventsObj = eventsObj;
			next();
		} );
	},
	createKWObj: function ( req, res, next ) {
		let base1 = 'JavaScript/developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/';
		let base2 = 'JavaScript/developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/';
		let KWObj = {};
		fs.readdir( './docs/mdn/javascript/documents/' + base1, function ( err, files ) {
			if ( err ) console.log( err );
			files = files.filter( elem => {
				return elem.includes( '.html' );
			} );
			for ( let k of files ) {
				KWObj[ k.replace( '.html', "" ) ] = base1 + k;
			}
		} );
		fs.readdir( './docs/mdn/javascript/documents/' + base2, function ( err, files ) {
			if ( err ) console.log( err );
			files = files.filter( elem => {
				return elem.includes( '.html' );
			} );
			for ( let k of files ) {
				KWObj[ k.replace( '.html', "" ) ] = base2 + k;
			}
			req.KWObj = KWObj;
			next();
		} );
	},
	createFuncObj: function ( req, res, next ) {
		let base = 'JavaScript/developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/';
		let funcObj = {};

		fs.readdir( './docs/mdn/javascript/documents/' + base, function ( err, files ) {
			if ( err ) console.log( err );
			files = files.filter( elem => {
				return elem.includes( '.html' );
			} );
			for ( let k of files ) {
				funcObj[ k.replace( '.html', "" ) ] = base + k;
			}
			req.funcObj = funcObj;
			next();
		} );
	},
	sqlFile: function ( req, res, next ) {
		var d = new Date();
		let i = 0;
		let objects = {
			function: req.funcObj,
			key_word: req.KWObj,
			events: req.eventsObj,
			methods: req.methodObj,
			class: req.classObj
		};
		console.log(d.getMinutes(), d.getSeconds());

		let jsonIndex = {'source': req.scrapeProps.sourceName, 'result': []};
		for ( let k in objects ) {
			// console.log( k );
			for ( let j in objects[ k ] ) {
				jsonIndex.result.push({"NAME": j, "TYPE": k, "LINK": objects[k][j]});
			}
		}
		jsonIndex = JSON.stringify(jsonIndex);
		fs.writeFileSync( "docs/mdn/javascript/index.json", jsonIndex );
		d = new Date();
		console.log(d.getMinutes(), d.getSeconds());

		next();
	},
	zip: function ( req, res, next ) {
		console.log('zipping');
		let output = fs.createWriteStream( './zips/mdn/mdn_javascript.zip');
		//Add to req
		req.scrapeProps.filePath = './zips/mdn/mdn_javascript.zip';
		let archive = archiver('zip');
		var d = new Date();
		console.log(d.getMinutes(), d.getSeconds());

		output.on('close', function() {
		  fs.unlink('./temp/JavaScript.tgz', (err) => {
			  if(err) console.log(err);
			  d = new Date;
			  req.funcObj = null;
  			  req.KWObj = null;
  			  req.eventsObj = null;
  			  req.methodObj = null;
  			  req.classObj = null;
			  jsonIndex = null;
	  		  console.log(d.getMinutes(), d.getSeconds());
			  console.log(archive.pointer() + ' total bytes');
			  console.log('archiver has been finalized and the output file descriptor has closed.');
			//   folderHandler.deleteFolderRecursive(req.scrapeProps.baseDir);
			  next();

		  } )
		});

		archive.on('error', function(err) {
		  throw err;
		});

		archive.pipe(output);

		archive.bulk([
		  { expand: true, cwd: 'docs/mdn/javascript', src: ['**'], dest:'mdn_javascript.docs' }
		]);

		archive.finalize();
	}
};


module.exports = mdnJS;
