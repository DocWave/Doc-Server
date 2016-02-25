'use strict';
const cheerio = require( 'cheerio' );
const request = require( 'request' );
const fs = require( 'fs' );
const targz = require( 'tar.gz' );
const zlib = require( 'zlib' );
const path = require( 'path' );
const tar = require( 'tar' );
const SQL = require( 'sql.js' );
const archiver = require( 'archiver' );

let mdn = {

	/*
	* This function goes to kapeli.com, grabs the Javascript link,
	* then attaches it to the req obj
	*/

	download: function ( req, res, next ) {
		request( 'https://kapeli.com/mdn_offline', function ( err, html ) {
			if ( err ) console.log( err );
			let $ = cheerio.load( html.body );

			//Only use the link that contains the text 'Javascript.tgz'
			let downloadLink = "https://kapeli.com/" + $( ".download:contains('JavaScript.tgz')" )
				.attr( "href" );
			req.JSdownloadLink = downloadLink;
			next();
		} );
	},
	//downloads tar file from kapeli.com
	getJavascript: function ( req, res, next ) {
		//downloading 116 MB .tar to disk

		//Check if js file exists

		let write = fs.createWriteStream( './JavaScript.tgz' );

		///////////////////////////////////////////////////////
		// using the request stream as a ReadStream
		// NOTE: req.downloadLink initialized in mdn.download
		//////////////////////////////////////////////////////
		let read = request( req.JSdownloadLink )
			.on( 'error', function ( err ) {
				throw err;
			} )
			.pipe( write );

		//just to log bytes written - not necessary
		let watcher = fs.watch( './JavaScript.tgz' )
			.on( 'change', function () {
				let bytes=(read.bytesWritten/1000000).toFixed(2);
				require('single-line-log').stdout('JS: ',bytes +' MB');
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
				path: './docs'
			} )
			.on( 'error', function ( err ) {
				throw err;
			} )
			.on( 'end', function () {
				console.log( 'extracted' );
			} );
		let extracting = fs.createReadStream( './JavaScript.tgz' )
			.on( 'error', function ( err ) {
				throw err;
			} )
			.pipe( inflate )
			.pipe( extractor );
		extracting.on( 'finish', function () {
			next();
		} );
	},
	createClassObj: function ( req, res, next ) {
		let base = 'JavaScript/developer.mozilla.org/en-US/docs/Web/API/';
		let classObj = {};

		fs.readdir( './docs/' + base, function ( err, files ) {
			if ( err ) console.log( err );
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
		let base = 'JavaScript/developer.mozilla.org/en-US/docs/Web/API/';
		let methodObj = {};

		let directories = getDirectories( './docs/' + base );
		directories.forEach( elem => {
			fs.readdir( `docs/${base}/${elem}`, function ( err, files ) {
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

		fs.readdir( './docs/' + base, function ( err, files ) {
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
		fs.readdir( './docs/' + base1, function ( err, files ) {
			if ( err ) console.log( err );
			files = files.filter( elem => {
				return elem.includes( '.html' );
			} );
			for ( let k of files ) {
				KWObj[ k.replace( '.html', "" ) ] = base1 + k;
			}
		} );
		fs.readdir( './docs/' + base2, function ( err, files ) {
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

		fs.readdir( './docs/' + base, function ( err, files ) {
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
		let i = 0;
		let objects = {
			function: req.funcObj,
			key_word: req.KWObj,
			events: req.eventsObj,
			methods: req.methodObj,
			class: req.classObj
		};

		let db = new SQL.Database();
		db.run( "CREATE TABLE docsearch (ID int, NAME char, TYPE char, LINK char);" );

		for ( let k in objects ) {
			console.log( k );
			for ( let j in objects[ k ] ) {
				db.run( "INSERT INTO docsearch VALUES (:ID, :NAME, :TYPE, :LINK)", {
					':ID': i++,
					':NAME': j,
					':TYPE': k,
					':LINK': objects[ k ][ j ]
				} );
			}
		}
		let data = db.export();
		let buffer = new Buffer( data );

		fs.writeFileSync( "docs/mdn_javascript.sqlite", buffer );

		next();
	},
	zip: function ( req, res, next ) {
		console.log('zipping');
		let output = fs.createWriteStream( 'zips/mdn/javascript/mdn_javascript.zip');
		let archive = archiver('zip');

		output.on('close', function() {
		  fs.unlink('./JavaScript.tgz', (err) => {
			  if(err) console.log(err);
			  console.log(archive.pointer() + ' total bytes');
			  console.log('archiver has been finalized and the output file descriptor has closed.');
		  } );
		});

		archive.on('error', function(err) {
		  throw err;
		});

		archive.pipe(output);

		archive.bulk([
		  { expand: true, cwd: 'docs/', src: ['**'], dest:'mdn_javascript.docs' }
		]);

		archive.finalize();
		next();
	}
};


module.exports = mdn;
