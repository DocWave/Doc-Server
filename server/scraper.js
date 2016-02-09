var scraper = require('website-scraper');
var fs = require('fs');
var cheerio = require('cheerio');
var archiver = require('archiver');
var folderHandler = require('./folderHandler');
var parseEntry = require('./parseEntryPoint');

//Specify type of archive - zip or tar
//Constants to be changed or added later with inputs to program
/* Want structure of directory of files to be eg /node.docs/docs/
*  with the sql file in /node.docs
*  and temporary directory to be documentation/
*  so docs/+SCRAPE_DIR+/documents will be DOWNLOAD_DIR
*  BASE_DIR will be docs/SCRAPE_DIR  maybe rename SCRAPE_DIR?
*/
module.exports = function nodeScraper(req, res, next){
    const   URL_TO_SCRAPE = 'http://nodejs.org/api/',
            SOURCE_NAME = 'Node API',
            CSS_DIR = 'assets',
            JS_DIR = 'assets',
            SCRAPE_DIR = 'node/',
            BASE_DIR = 'docs/'+SCRAPE_DIR,
            DOWNLOAD_DIR = BASE_DIR+'documents/';

    var versionNo;

    var archive = archiver('zip');

    //Create output file stream from SCRAPE_DIR
    var output = fs.createWriteStream(SCRAPE_DIR.slice(0,-1)+'.zip');
    //Check to see if folder was deleted or not, and if so, delete it
    folderHandler.checkFolders(BASE_DIR);

    /*
    * Initialize scraper and provide URL, directory to store files, subdirectories
    * FOR files, recurse 1 level deep, and then edit files
    */
    scraper.scrape({
      urls: [URL_TO_SCRAPE],
      directory: DOWNLOAD_DIR,
      subdirectories: [
    		{directory: 'img', extensions: ['.jpg', '.png', '.svg']},
    		{directory: JS_DIR, extensions: ['.js']},
    		{directory: CSS_DIR, extensions: ['.css']}
    	],
      recursive: true,
      maxDepth: 1
    }).then((data)=>{
        getFiles();
    }).catch(console.log);

    //Event listener for end of zipping function - delete folder
    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
        folderHandler.deleteFolderRecursive(BASE_DIR);
        res.filePath = output.path;
        res.sourceName = SOURCE_NAME;
        res.versionNo = versionNo;
        next();
    });

    archive.on('error', function(err){
        throw err;
    });

    //get list of files to change the hrefs for css and js files to exclude beggining / if they have it
    function getFiles() {
        var list;
        //Get list of files in directory
        fs.readdir(DOWNLOAD_DIR, (err, file) => {
            list = file;
            list.forEach((name) => {
                //Add directory name to file name for FS
                name = DOWNLOAD_DIR.concat(name);
                //only edit html files
                if(name.match(/\.html$/)){
                    //pass file names off to be read and rewritten
                    editFile(name);
                }
            });

            //Since readdir is async, and is also called by parseEntry, we need to promisify it, and
            //send the resolve over
            var p1 = new Promise((resolve, reject)=>{
                parseEntry.allFiles(BASE_DIR, DOWNLOAD_DIR, resolve, reject);
            });

            p1.then(function(val){
                //Time to zip the file
                //Pipe zip to the output file
                archive.pipe(output);
                //specify what to zip up (in this case the directory itself) and append them to the zip
                //Make the directory the zip file extracts to to be based on the SCRAPE_DIR
                archive.bulk([
                    { expand: true, cwd: BASE_DIR, src: ['**'], dest: SCRAPE_DIR.slice(0,-1)+'.docs'}
                ]);
                // archive.append()
                //Finalize archive and prevent further appends
                archive.finalize();
            }).catch((val)=>{
                console.log("Promise rejected: ", val)
            })

        });
    }

    function editFile(file) {
        fs.readFile(file, 'utf-8', (err, data) => {
            //Remove front slash on src and href of js and css file locations
            var newData = data.replace(/href=\"\/(?!\/)/gi, 'href="').
                replace(/src=\"\/(?!\/)/gi, 'src="');
            //Call function to remove extraneous stuff
            newData = nodeRewrite(newData);
            //Rewrite file
            fs.writeFile(file, newData, 'utf-8', (err)=>{
                if(err){
                     console.log(err);
                }
            });
        });

    }

    //Specific nodejs.com documentation removal of ToC and sidebar
    function nodeRewrite(html) {
        var $ = cheerio.load(html);
        //store in a temp first, in case it doesnt exist
        var temp = $('header h1').text();
        if(!versionNo && temp){
            //Grab the part that matches version number and trim it to get rid of spaces
            //then slice off the first character (the v)
            temp = temp.match(/\sv.*\s/)[0].trim().slice(1);
        }
        $('#column2').remove();
        $('#toc').remove();
        $('header').remove();
        html = $.html();
        //Don't let it run all day
        //Send version number
        versionNo = temp;
        //Return full html to be written as file instead of html and cheerio data
        return html;
    }

}
