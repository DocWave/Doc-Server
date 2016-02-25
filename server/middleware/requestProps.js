'use strict';
//Constants to be changed or added later with inputs to program
/* Structure of directory to be eg /node.docs/docs/
*  with the sql file in /node.docs
*  and temporary directory to be documentation/
*  so docs/+scrapeDir+/documents will be downloadDir
*  baseDir will be docs/scrapeDir  maybe rename scrapeDir?
*/

let requestProps = {
    node: function(req, res, next){
        req.scrapeProps = {
            urlsToScrape: ['http://nodejs.org/api/'],
            sourceName: 'NodeJS',
            cssDir: 'assets',
            jsDir: 'assets',
            scrapeDir: 'node/',
            //FIX THIS LATER TO ADD IN ANYTHING, AND BE PASSED IN AS AN OBJECT
            //WHY CANT I USE THIS. HERE?
            baseDir: 'docs/node/',
            downloadDir: 'docs/node/documents/',
            RECURSIVE: true,
            versionNo: "",
        };
        next();
    },
    express2: function(req,res,next){
        req.scrapeProps = {
            sourceName: 'ExpressJS',
            cssDir: 'css',
            jsDir: 'js',
            scrapeDir: 'express/',
            baseDir: 'docs/express/',
            downloadDir: 'zips/express/express.docs/documents/',
            RECURSIVE: false,
            versionNo: "",
        };
        next();
    },
    express: function(req, res, next){
        req.scrapeProps = {
            urlsToScrape: [
                        {url: 'http://expressjs.com/en/4x/api.html', filename: 'api.html'},
                        {url: 'http://expressjs.com/en/starter/installing.html', filename: 'installing.html'},
                        {url: 'http://expressjs.com/en/starter/hello-world.html', filename: 'hello-world.html'},
                        {url: 'http://expressjs.com/en/starter/generator.html', filename: 'generator.html'},
                        {url: 'http://expressjs.com/en/starter/static-files.html', filename: 'static-files.html'},
                        {url: 'http://expressjs.com/en/starter/faq.html', filename: 'faq.html'},
                        {url: 'http://expressjs.com/en/guide/routing.html', filename: 'routing.html'},
                        {url: 'http://expressjs.com/en/guide/writing-middleware.html', filename: 'writing-middleware.html'},
                        {url: 'http://expressjs.com/en/guide/using-middleware.html', filename: 'using-middleware.html'},
                        {url: 'http://expressjs.com/en/guide/using-template-engines.html', filename: 'using-template-engines.html'},
                        {url: 'http://expressjs.com/en/guide/error-handling.html', filename: 'error-handling.html'},
                        {url: 'http://expressjs.com/en/guide/debugging.html', filename: 'debugging.html'},
                        {url: 'http://expressjs.com/en/guide/database-integration.html', filename: 'database-integration.html'},
                        {url: 'http://expressjs.com/en/guide/migrating-4.html', filename: 'migrating-4.html'},
                        {url: 'http://expressjs.com/en/advanced/developing-template-engines.html', filename: 'developing-template-engines.html'},
                        {url: 'http://expressjs.com/en/advanced/best-practice-performance.html', filename: 'best-practice-performance.html'},
                        {url: 'http://expressjs.com/en/advanced/best-practice-security.html', filename: 'best-practice-security.html'}
                    ],
            sourceName: 'Express API',
            cssDir: 'css',
            jsDir: 'js',
            scrapeDir: 'express/',
            //FIX THIS LATER TO ADD IN ANYTHING, AND BE PASSED IN AS AN OBJECT
            //WHY CANT I USE THIS. HERE?
            baseDir: 'docs/express/',
            downloadDir: 'docs/express/documents/',
            RECURSIVE: false,
            versionNo: "",
        };
        next();
    },
    js: function(req, res, next){
        req.scrapeProps = {
            // URL_TO_SCRAPE: ,
            sourceName:"MDN Javascript",
            // CSS_DIR: ,
            // JS_DIR: ,
            scrapeDir: 'mdn/javascript/',
            baseDir: 'docs/mdn/javascript/',
            downloadDir: 'docs/mdn/javascript/JavaScript/documents'
          };
        next();
    },
    html: function(req, res, next){
        req.scrapeProps = {
            // URL_TO_SCRAPE: ,
            sourceName:"MDN HTML",
            // CSS_DIR: ,
            // JS_DIR: ,
            scrapeDir: 'mdn/html/',
            baseDir: 'docs/mdn/html/',
            downloadDir: 'docs/mdn/html/HTML/documents'
          };
        next();
    },
    css: function(req, res, next){
        req.scrapeProps = {
            // URL_TO_SCRAPE: ,
            sourceName:"MDN CSS",
            // CSS_DIR: ,
            // JS_DIR: ,
            scrapeDir: 'mdn/css/',
            baseDir: 'docs/mdn/css/',
            downloadDir: 'docs/mdn/css/CSS/documents'
          };
        next();
    },

};

module.exports = requestProps;
