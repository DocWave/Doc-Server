'use strict'
const cheerio = require( 'cheerio' );
const request = require( 'request' );
const fs = require( 'fs' );
const targz = require( 'tar.gz' );
const zlib = require( 'zlib' );
const inflate = zlib.Unzip();
const path = require( 'path' );
const tar = require( 'tar' );

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
				path: './'
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
		getHTML(base, classObj, req.classObj, next);
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

		let directories = getDirectories( '.' + base );
		directories.forEach(elem => {
			fs.readdir(`.${base}/${elem}`, function(err, files){
				files.forEach(fileElem => {
					let key  = `${elem}.${fileElem}`;
					methodObj[key.replace(".html", "")] = `${base}/${elem}/${fileElem}`;
				});
				req.methodObj = methodObj;
				next();
			});
		});
	},
	createEventObj: function(req, res, next){
		let base = '/JavaScript/developer.mozilla.org/en-US/docs/Web/Events';
		let eventsObj = {};
		getHTML(base, eventsObj, req.eventsObj, next);
	},
	createKWObj : function(req, res, next){
		let base1 = '/JavaScript/developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators';
		let base2 = '/JavaScript/developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements';
		let KWObj = {};
		getHTML(base1, KWObj, req.KWObj, next);
		getHTML(base2, KWObj, req.KWObj, next);
	},
	createFuncObj : function( req, res, next){
		let base = '/JavaScript/developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects';
		let funcObj = {};
		getHTML(base, funcObj, req.funcObj, next);
	}
};
//helper functions
function getHTML(base, objName, req, next){

	fs.readdir( '.' + base, function ( err, files ) {
		if(err)console.log(err);
		files = files.filter( elem => {
			return elem.includes( '.html' );
		} );
		for ( var k of files ) {
			objName[ k.replace( '.html', "" ) ] = base + k;
		}
		resolve(files);
	} );
}
new Promise (function(resolve, reject){getHTML(base, ObjName, req, next)})
module.exports = mdn;
