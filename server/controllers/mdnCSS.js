'use strict'
const cheerio = require( 'cheerio' );
const request = require( 'request' );
const fs = require( 'fs' );
const targz = require( 'tar.gz' );
const zlib = require( 'zlib' );
const path = require( 'path' );
const tar = require( 'tar' );
const SQL = require( 'sql.js' );
const archiver = require( 'archiver' );

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

		let write = fs.createWriteStream( './mdnFiles/css.tgz' );

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
		let watcher = fs.watch( './mdnFiles/css.tgz' )
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
				path: './doc'
			} )
			.on( 'error', function ( err ) {
				throw err;
			} )
			.on( 'end', function () {
				console.log( 'extracted' );
			} );
		let extracting = fs.createReadStream( './mdnFiles/css.tgz' )
			.on( 'error', function ( err ) {
				throw err;
			} )
			.pipe( inflate )
			.pipe( extractor );
		extracting.on( 'finish', function () {
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
		fs.writeFileSync( "doc/mdn_javascript.sqlite", buffer );

		next();
	},
	zip: function ( req, res, next ) {
		let output = fs.createWriteStream( './mdn_javascript.zip');
		let archive = archiver('zip');

		output.on('close', function() {
		  console.log(archive.pointer() + ' total bytes');
		  console.log('archiver has been finalized and the output file descriptor has closed.');
		});

		archive.on('error', function(err) {
		  throw err;
		});

		archive.pipe(output);

		archive.bulk([
		  { expand: true, cwd: 'doc/', src: ['**'], dest:'mdn_css.docs' }
		]);

		archive.finalize();
		next();
	}
};


module.exports = mdnCSS;
