'use strict'
const cheerio = require( 'cheerio' );
const request = require( 'request' );
const fs = require( 'fs' );
const targz = require( 'tar.gz' );
const zlib = require( 'zlib' );
const path = require( 'path' );
const tar = require( 'tar' );
const archiver = require( 'archiver' );
const folderHandler = require('./folderHandler');

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
			fs.mkdirSync('./temp');
		} catch (e) {
			console.log('./temp already exists');
		}

		let write = fs.createWriteStream( './temp/HTML.tgz' );

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
		let watcher = fs.watch( './temp/HTML.tgz' )
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
				path: './docs/mdn/html/documents/'
			} )
			.on( 'error', function ( err ) {
				console.log(err);
			} )
			.on( 'end', function () {
				console.log( 'extracted' );
				next();
			} );
		let extracting = fs.createReadStream( './temp/HTML.tgz' )
			.on( 'error', function ( err ) {
				console.log(err);
			} )
			.pipe( inflate )
			.pipe( extractor );
		extracting.on( 'finish', function () {
			// next();
		} );
	},
	getElements: function ( req, res, next ) {
		let base = '/HTML/developer.mozilla.org/en-US/docs/Web/HTML/Element',
	 			attrObj = {},
		 		elemObj = {};

		fs.readdir( './docs/mdn/html/documents/' + base, function ( err, files ) {
			if ( err ) console.log( err );
			files = files.filter( elem => {
				return elem.includes( '.html' ) && !elem.includes( '.dashtoc' );
			} );
			for ( let file of files ) {
				let nameOfElem =  file.replace( '.html', "" ),
				 		attrLinks = [],
						attrIds;

				let $ = cheerio.load( fs.readFileSync( `./docs/mdn/html/documents${base}/${file}` ) );

				$( "a[name*='attr-']" ).each( (i , el) => {
					if($(el).attr('name')){
						attrIds = $( el ).attr('name').replace(/attr-/g, "");
						// console.log(attrIds);
						$(el).attr(`id, #${attrIds}`);
						attrObj[`${nameOfElem}.${attrIds}`] = `${base}/${file}/#${attrIds}`;
					}
				});
				elemObj[ nameOfElem ] = base + file;
			}

			req.elemObj = elemObj;
			req.attrObj = attrObj;
			next();
		} );
	},
	sqlFile: function ( req, res, next ) {
		let i = 0;
		// let db = new SQL.Database();
		// db.run( "CREATE TABLE docsearch (ID int, NAME char, TYPE char, LINK char);" );
		let jsonIndex = {"sourceName": req.scrapeProps.sourceName, "result": []};
		for ( let elemName in req.elemObj ) {
			jsonIndex.result.push({"NAME": elemName, "TYPE": "element", "LINK": req.elemObj[elemName]});
				// ':ID': i++,
				// ':NAME': elemName,
				// ':TYPE': "element",
				// ':LINK': req.elemObj[ elemName ]
		}
		for ( let attrName in req.attrObj ) {
			jsonIndex.result.push({"NAME": attrName, "TYPE": "attribute", "LINK": req.elemObj[attrName]});
				// ':ID': i++,
				// ':NAME': attrName,
				// ':TYPE': "attribute",
				// ':LINK': req.attrObj[attrName]
		}
		// let data = db.export();
		jsonIndex = JSON.stringify(jsonIndex);
		fs.writeFileSync( "./docs/mdn/html/index.json", jsonIndex );
		next();
	},

	zip: function ( req, res, next ) {
		let output = fs.createWriteStream( './zips/mdn/mdn_html.zip');
		let archive = archiver('zip');
		req.scrapeProps.filePath = './zips/mdn/mdn_html.zip';

		output.on('close', function() {
			fs.unlink('./temp/HTML.tgz', (err) => {
				if(err) console.log(err);
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
		  { expand: true, cwd: 'docs/mdn/html', src: ['**'], dest:'mdn_html.docs' }
		]);

		archive.finalize();
	}
};


module.exports = mdnHTML;
