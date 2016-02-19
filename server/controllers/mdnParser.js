'use strict'
const cheerio = require( 'cheerio' );
const request = require( 'request' );
const fs = require( 'fs' );
const targz = require( 'tar.gz' );
const zlib = require( 'zlib' );
const inflate = zlib.Unzip();
const path = require( 'path' );
const tar = require( 'tar' );
const SQL = require( 'sql.js' );
const archiver = require( 'archiver' );

let mdn = {
	download: function ( req, res, next ) {
		request( 'https://kapeli.com/mdn_offline', function ( err, html ) {
			if ( err ) console.log( err );
			let $ = cheerio.load( html.body );
			let downloadLink = "https://kapeli.com/" + $( ".download:contains('JavaScript.tgz')" )
				.attr( "href" );
			res.downloadLink = downloadLink;
			next();
		} );
	},
	getJavascript: function ( req, res, next ) {
		var write = fs.createWriteStream( './JavaScript.tgz' );
		var read = request( res.downloadLink )
			.on( 'error', function ( err ) {
				throw err;
			} )
			.pipe( write );

		fs.watch( './JavaScript.tgz' )
			.on( 'change', function () {
				console.log( read.bytesWritten );
			} );

		read.on( 'finish', function () {
			read.close( next() );
		} );
	},
	extract: function ( req, res, next ) {
		console.log( 'extracting...' );
		var extractor = tar.Extract( {
				path: '/doc'
			} )
			.on( 'error', function ( err ) {
				throw err;
			} )
			.on( 'end', function () {
				console.log( 'extracted' );
			} );
		var extracting = fs.createReadStream( './JavaScript.tgz' )
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
		let base = '/JavaScript/developer.mozilla.org/en-US/docs/Web/API';
		let classObj = {};

		fs.readdir( './doc' + base, function ( err, files ) {
			if ( err ) console.log( err );
			files = files.filter( elem => {
				return elem.includes( '.html' );
			} );
			for ( var k of files ) {
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
		let base = '/JavaScript/developer.mozilla.org/en-US/docs/Web/API';
		let methodObj = {};

		let directories = getDirectories( './doc' + base );
		directories.forEach( elem => {
			fs.readdir( `doc/${base}/${elem}`, function ( err, files ) {
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
		let base = '/JavaScript/developer.mozilla.org/en-US/docs/Web/Events';
		let eventsObj = {};

		fs.readdir( './doc' + base, function ( err, files ) {
			if ( err ) console.log( err );
			files = files.filter( elem => {
				return elem.includes( '.html' );
			} );
			for ( var k of files ) {
				eventsObj[ k.replace( '.html', "" ) ] = base + k;
			}
			req.eventsObj = eventsObj;
			next();
		} );
	},
	createKWObj: function ( req, res, next ) {
		let base1 = '/JavaScript/developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators';
		let base2 = '/JavaScript/developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements';
		let KWObj = {};
		fs.readdir( './doc' + base1, function ( err, files ) {
			if ( err ) console.log( err );
			files = files.filter( elem => {
				return elem.includes( '.html' );
			} );
			for ( var k of files ) {
				KWObj[ k.replace( '.html', "" ) ] = base1 + k;
			}
		} );
		fs.readdir( './doc' + base2, function ( err, files ) {
			if ( err ) console.log( err );
			files = files.filter( elem => {
				return elem.includes( '.html' );
			} );
			for ( var k of files ) {
				KWObj[ k.replace( '.html', "" ) ] = base2 + k;
			}
			req.KWObj = KWObj;
			next();
		} );
	},
	createFuncObj: function ( req, res, next ) {
		let base = '/JavaScript/developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects';
		let funcObj = {};

		fs.readdir( './doc' + base, function ( err, files ) {
			if ( err ) console.log( err );
			files = files.filter( elem => {
				return elem.includes( '.html' );
			} );
			for ( var k of files ) {
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

		for ( var k in objects ) {
			console.log( k );
			for ( var j in objects[ k ] ) {
				db.run( "INSERT INTO docsearch VALUES (:ID, :NAME, :TYPE, :LINK)", {
					':ID': i++,
					':NAME': j,
					':TYPE': k,
					':LINK': objects[ k ][ j ]
				} );
			}
		}
		var data = db.export();
		var buffer = new Buffer( data );
		fs.writeFileSync( "doc/mdn_javascript.sqlite", buffer );

		next();
	},
	// makeFile: function ( req, res, next ) {
	// 	fs.mkdirSync( './mdn_javascript');
	//
	//
	// },
	zip: function ( req, res, next ) {
		var output = fs.createWriteStream( './mdn_javascript.zip');
		var archive = archiver('zip');

		output.on('close', function() {
		  console.log(archive.pointer() + ' total bytes');
		  console.log('archiver has been finalized and the output file descriptor has closed.');
		});

		archive.on('error', function(err) {
		  throw err;
		});

		archive.pipe(output);

		archive.bulk([
		  { expand: true, cwd: 'doc/', src: ['**'], dest:'mdn_javascript.docs' }
		]);

		archive.finalize();
		next();
	}
};


module.exports = mdn;
