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
        var zipFolder = 'zips/'+req.scrapeProps.scrapeDir;
        //check to see if folder exists or create folder to store zip if it doesn't exist
        folderHandler.checkOrCreateFolder(zipFolder);
        //Create output file stream from scrapeDir
        req.output = fs.createWriteStream(zipFolder+req.scrapeProps.scrapeDir.slice(0,-1)+'.zip');
        this.scrape(req, res, next);
    },

    scrape: function(req, res, next){
        //Check to see if folder was deleted or not, and if so, delete it
        folderHandler.checkToDelete(req.scrapeProps.baseDir);

        /*
        * Initialize scraper and provide URL, directory to store files, subdirectories
        * FOR files, recurse 1 level deep, and then edit files
        */
        scraper.scrape({
          urls: req.scrapeProps.urlsToScrape,
          directory: req.scrapeProps.downloadDir,
          subdirectories: [
        		{directory: 'img', extensions: ['.jpg', '.png', '.svg']},
        		{directory: req.scrapeProps.jsDir, extensions: ['.js']},
        		{directory: req.scrapeProps.cssDir, extensions: ['.css']}
        	],
          recursive: req.scrapeProps.RECURSIVE,
          maxDepth: 1
        }).then((data)=>{
            this.getFiles(req, res, next);
        }).catch(console.log);

        //Event listener for end of zipping function - delete folder
        req.output.on('close', ()=>{
            console.log(req.archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');
            folderHandler.deleteFolderRecursive(req.scrapeProps.baseDir);
            req.scrapeProps.filePath = req.output.path;
            console.log(req.output.path);
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
        fs.readdir(req.scrapeProps.downloadDir, (err, file) => {
            list = file;
            list.forEach((name) => {
                //Add directory name to file name for FS
                name = req.scrapeProps.downloadDir.concat(name);
                //only edit html files
                if(name.match(/\.html$/)){
                    //pass file names off to be read and rewritten
                    this.editFile(req, res, next, name);
                }
            });

            //Since readdir is async, and is also called by parseEntry, we need to promisify it, and
            //send the resolve over
            var p1 = new Promise((resolve, reject)=>{
                parseEntry.allFiles(req, resolve, reject);
            });

            p1.then(function(val){
                //Time to zip the file
                //Pipe zip to the output file
                req.archive.pipe(req.output);
                //specify what to zip up (in this case the directory itself) and append them to the zip
                //Make the directory the z1ip file extracts to to be based on the scrapeDir
                //Use that, since this is bound to archive module
                req.archive.bulk([
                    { expand: true, cwd: req.scrapeProps.baseDir, src: ['**'], dest: req.scrapeProps.scrapeDir.slice(0,-1)+'.docs'}
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
            // console.log("ok", data);
            var newData = data.replace(/href=\"\/(?!\/)/gi, 'href="').
                replace(/src=\"\/(?!\/)/gi, 'src="');
            //Made the rewriter universal for whatever we are scraping
            //Will need to impliment checks to make sure we have methods for those sites

            var writeMethod = req.scrapeProps.scrapeDir.slice(0, -1)
            //Call function to remove extraneous stuff but ITS DYNAMIC!!!
            //Try and catch in case we don't have the required methods
            try{
                newData = rewrite[writeMethod](req, res, next, newData);
            }
            catch(err){
                console.error("WHOA WE DONT HAVE A FUNCTION FOR THIS")
                // res.send(`<h1 style="text-align: center">Sorry, there seems to be a problem with our parsing engine,<br>Please contact us</strong>`)
                return res.end()
            }
            //Rewrite file
            fs.writeFileSync(file, newData, 'utf-8')
        });
    },


}
module.exports = scrapeParseWrite;
