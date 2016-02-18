'use strict'
//Constants to be changed or added later with inputs to program
/* Structure of directory to be eg /node.docs/docs/
*  with the sql file in /node.docs
*  and temporary directory to be documentation/
*  so docs/+SCRAPE_DIR+/documents will be DOWNLOAD_DIR
*  BASE_DIR will be docs/SCRAPE_DIR  maybe rename SCRAPE_DIR?
*/

let requestProps = {
    node: function(req, res, next){
        req.scrapeProps = {
            URL_TO_SCRAPE: ['http://nodejs.org/api/'],
            SOURCE_NAME: 'Node API',
            CSS_DIR: 'assets',
            JS_DIR: 'assets',
            SCRAPE_DIR: 'node/',
            //FIX THIS LATER TO ADD IN ANYTHING, AND BE PASSED IN AS AN OBJECT
            //WHY CANT I USE THIS. HERE?
            BASE_DIR: 'docs/node/',
            DOWNLOAD_DIR: 'docs/node/documents/',
        }
        next();
    },
    express: function(req, res, next){
        req.scrapeProps = {
            URL_TO_SCRAPE: [
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
            SOURCE_NAME: 'Express API',
            CSS_DIR: 'css',
            JS_DIR: 'js',
            SCRAPE_DIR: 'express/',
            //FIX THIS LATER TO ADD IN ANYTHING, AND BE PASSED IN AS AN OBJECT
            //WHY CANT I USE THIS. HERE?
            BASE_DIR: 'docs/express/',
            DOWNLOAD_DIR: 'docs/node/express/',
        };
        next();
    },
    mdn: function(req, res, next){
      req.scrapeProps = {
        // URL_TO_SCRAPE: ,
        SOURCE_NAME:"MDN Javascript",
        // CSS_DIR: ,
        // JS_DIR: ,
        SCRAPE_DIR: 'mdn/javascript/',
        BASE_DIR: 'docs/mdn/javascript/',
        DOWNLOAD_DIR: 'docs/javascript/documents'
      };
      next();
    }

};

module.exports = requestProps;
