'use strict'
var scraper = require('website-scraper');
var fs = require('fs');
var cheerio = require('cheerio');
var archiver = require('archiver');

var rewrite = require('./rewrite')
var folderHandler = require('./folderHandler');
var parseEntry = require('./parseEntryPoint');


var scrapeParseWrite = {

    createZip: function(req, res, next){
        //Initialize Archiver
        //Specify type of archive - zip or tar
        req.archive = archiver('zip');
        //check and create folder to store zip if it doesn't exist
        var zipFolder = 'zips/'+req.scrapeProps.SCRAPE_DIR;
        folderHandler.createFolder(zipFolder);
        //Create output file stream from SCRAPE_DIR
        req.output = fs.createWriteStream(zipFolder+'/'+req.scrapeProps.SCRAPE_DIR.slice(0,-1)+req.versionNo+'.zip');
        this.scrape(req, res, next);
    },

    scrape: function(req, res, next){
        //Check to see if folder was deleted or not, and if so, delete it
        folderHandler.checkToDelete(req.scrapeProps.BASE_DIR);

        /*
        * Initialize scraper and provide URL, directory to store files, subdirectories
        * FOR files, recurse 1 level deep, and then edit files
        */
        scraper.scrape({
          urls: req.scrapeProps.URL_TO_SCRAPE,
          directory: req.scrapeProps.DOWNLOAD_DIR,
          subdirectories: [
        		{directory: 'img', extensions: ['.jpg', '.png', '.svg']},
        		{directory: req.scrapeProps.JS_DIR, extensions: ['.js']},
        		{directory: req.scrapeProps.CSS_DIR, extensions: ['.css']}
        	],
          recursive: true,
          maxDepth: 1
        }).then((data)=>{
            this.getFiles(req, res, next);
        }).catch(console.log);

        //Event listener for end of zipping function - delete folder
        req.output.on('close', ()=>{
            console.log(req.archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');
            folderHandler.deleteFolderRecursive(req.scrapeProps.BASE_DIR);
            req.filePath = req.output.path;
            req.sourceName = req.scrapeProps.SOURCE_NAME;
            // res.versionNo = versionNo;
            next();
        });
        // Event listener for archive errors
        req.archive.on('error', function(err){
            throw err;
        });
    },


    //get list of files to change the hrefs for css and js files to exclude beggining / if they have it
    getFiles: function(req, res, next) {
        let list;

        //Add that because this object will be out of context in archive.bulk
        let that = this;
        //Get list of files in directory
        fs.readdir(req.scrapeProps.DOWNLOAD_DIR, (err, file) => {
            list = file;
            list.forEach((name) => {
                //Add directory name to file name for FS
                name = req.scrapeProps.DOWNLOAD_DIR.concat(name);
                //only edit html files
                if(name.match(/\.html$/)){
                    //pass file names off to be read and rewritten
                    // console.log(this.SCRAPE_DIR, "HEWHSH")
                    this.editFile(req, res, next, name);
                }
            });

            //Since readdir is async, and is also called by parseEntry, we need to promisify it, and
            //send the resolve over
            var p1 = new Promise((resolve, reject)=>{
                parseEntry.allFiles(req.scrapeProps.BASE_DIR, req.scrapeProps.DOWNLOAD_DIR, resolve, reject);
            });

            p1.then(function(val){
                //Time to zip the file
                //Pipe zip to the output file
                req.archive.pipe(req.output);
                //specify what to zip up (in this case the directory itself) and append them to the zip
                //Make the directory the zip file extracts to to be based on the SCRAPE_DIR
                //Use that, since this is bound to archive module
                req.archive.bulk([
                    { expand: true, cwd: req.scrapeProps.BASE_DIR, src: ['**'], dest: req.scrapeProps.SCRAPE_DIR.slice(0,-1)+'.docs'}
                ]);
                //Finalize archive and prevent further appends
                req.archive.finalize();
            }).catch((val)=>{
                console.log("Promise rejected: ", val)
            })

        });
    },

    editFile: function(req, res, next, file) {
        fs.readFile(file, 'utf-8', (err, data) => {
            //Remove front slash on src and href of js and css file locations
            var newData = data.replace(/href=\"\/(?!\/)/gi, 'href="').
                replace(/src=\"\/(?!\/)/gi, 'src="');
            //Made the rewriter universal for whatever we are scraping
            //Will need to impliment checks to make sure we have methods for those sites
            //Try catch maybe?
            var writeMethod = req.scrapeProps.SCRAPE_DIR.slice(0, -1)
            //Call function to remove extraneous stuff
            newData = rewrite[writeMethod](req, res, next, newData);
            //Rewrite file
            fs.writeFile(file, newData, 'utf-8', (err)=>{
                if(err){
                     console.log(err);
                }
            });
        });
    },


}
module.exports = scrapeParseWrite;
