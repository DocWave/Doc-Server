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

let mdnHTML = {
	/*
	* This function goes to kapeli.com, grabs the HTML link,
	* then attaches it to the req obj
	*/
	download: function ( req, res, next ) {
		request( 'https://kapeli.com/mdn_offline', function ( err, html ) {
			if ( err ) console.log( err );
			let $ = cheerio.load( html.body );

			//Only use the link that contains the text 'HTML.tgz'
			let HTMLdownloadLink = "https://kapeli.com/" + $( ".download:contains('HTML.tgz')" )
				.attr( "href" );
			req.HTMLdownloadLink = HTMLdownloadLink;
			next();
		} );
	},
	//downloads tar file from kapeli.com
	getHTML: function ( req, res, next ) {
		//NOTE:downloading 24 MB .tar to disk
		try {
			fs.mkdir('./mdnFiles');
		} catch (e) {
			console.log('./mdnFiles already exists');
		}

		let write = fs.createWriteStream( './mdnFiles/HTML.tgz' );

		///////////////////////////////////////////////////////
		// using the request stream as a ReadStream
		// NOTE: req.downloadLink initialized in mdn.download
		//////////////////////////////////////////////////////
		let read = request( req.HTMLdownloadLink )
			.on( 'error', function ( err ) {
				throw err;
			} )
			.pipe( write );

		//just to log bytes written - not necessary
		let watcher = fs.watch( './mdnFiles/HTML.tgz' )
			.on( 'change', function () {
				let bytes=(read.bytesWritten/1000000).toFixed(2);
				require('single-line-log').stdout('HTML: ',bytes +' MB');
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
				console.log(err);
			} )
			.on( 'end', function () {
				console.log( 'extracted' );
			} );
		let extracting = fs.createReadStream( './mdnFiles/html.tgz' )
			.on( 'error', function ( err ) {
				console.log(err);
			} )
			.pipe( inflate )
			.pipe( extractor );
		extracting.on( 'finish', function () {
			next();
		} );
	},
	getElements: function(req, res, next){
		let base = '/HTML/developer.mozilla.org/en-US/docs/Web/HTML/Element';
		let attrObj = {};
		let elemObj = {};

		fs.readdir( './doc' + base, function ( err, files ) {
			if ( err ) console.log( err );
			files = files.filter( elem => {
				return elem.includes( '.html' );
			} );
			for ( let file of files ) {
				elemObj[ file.replace( '.html', "" ) ] = base + file;
    		let $ = cheerio.load(file);
				let idName = $("a:regex(name, attr-*)").text();
				let attrArr = $("a:regex(name, attr-*)");
				attrArr.forEach((el,i)=>{
					$(el).attr(`href, #${idName[i]}`);
					elemObj[file.replace( '.html', "" )][idName] = `${base}${file}#${idName}`;
				});
			}
			req.elemObj = elemObj;
			next();
		});
	},
	sqlFile: function ( req, res, next ) {
		let i = 0;
		let HTMLObj = {
			element: req.elemObj,
		};

		let db = new SQL.Database();
		db.run( "CREATE TABLE docsearch (ID int, NAME char, TYPE char, LINK char);" );

		for ( let k in HTMLObj ) {
			console.log( k );
			for ( let j in HTMLObj[ k ] ) {
				db.run( "INSERT INTO docsearch VALUES (:ID, :NAME, :TYPE, :LINK)", {
					':ID': i++,
					':NAME': j,
					':TYPE': k,
					':LINK': HTMLObj[ k ][ j ]
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
		  { expand: true, cwd: 'doc/', src: ['**'], dest:'mdn_html.docs' }
		]);

		archive.finalize();
		next();
	}
};


module.exports = mdnHTML;
