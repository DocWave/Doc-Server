'use strict'
const cheerio = require( 'cheerio' );
const request = require( 'request' );
const fs = require( 'fs' );
const targz = require('tar.gz');
const zlib = require('zlib');
const inflate = zlib.Unzip();
// const path = require( 'path' );
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
		var write = targz().createWriteStream( './JavaScript.tgz' );
		var read = request( res.downloadLink )
			.on( 'error', function ( err ) {
				throw err;
			})
			.pipe(write);

		fs.watch( './JavaScript.tgz' )
			.on( 'change', function () {
				console.log( read.bytesWritten );
			});

		read.on( 'finish', function () {
			read.close( next() );
		});
	}
  // extract: function (req, res, next) {
  //   targz().extract('./JavaScript.tgz', './', function(err){
  //     if(err)
  //       console.log('Something is wrong ', err.stack);
  //     console.log('Job done!');
	// 		next();
  //   });
	// 	// var extractor = tar.Extract( {
	// 	// 		path: './'
	// 	// 	})
	// 	// 	.on( 'error', function ( err ) {
	// 	// 		throw err;
	// 	// 	})
	// 	// 	.on( 'end', function () {
	// 	// 		console.log( 'extracted' );
	// 	// 	});
	// 	// var extracting = fs.createReadStream( './JavaScript.tgz' )
	// 	// 	.on( 'error', function ( err ) {
	// 	// 		throw err;
	// 	// 	})
	// 	// 	.pipe(inflate)
	// 	// 	.pipe(extractor);
	// 	// extracting.on( 'finish', function () {
	// 	// 	next();
	// 	// });
  // }
};

module.exports = mdn;
