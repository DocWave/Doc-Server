var request = require('request');
var cheerio = require('cheerio');

var versionCheck = {
    node: function(req, res, next){
        //Grab front page of node and check the version number;
        request.get('https://nodejs.org/api/index.html', (err, resp, body) =>{
            var $ = cheerio.load(body);
            var versionString = $('header h1').text();
            //Match returns an array, first element is the match!!
            versionString = versionString.match(/\sv.*\s/)[0].trim().slice(1);
            req.scrapeProps.versionNo = versionString;
            next();
        });
    },
    express: function(req, res, next){
        request.get('http://expressjs.com/en/4x/api.html', (err, resp, body) =>{
            var $ = cheerio.load(body);
            //Grab first anchor after #application-menu, most current ver
            var versionString = $('#application-menu a').attr('href');
            //Match returns an array, first element is the match!! slice off trailing /
            versionString = versionString.match(/[0-9]+.+\//)[0].slice(0,-1);
            req.scrapeProps.versionNo = versionString;
            next();
        });
    },
    js: function(req, res, next){
        request.get('https://kapeli.com/mdn_offline', (err, resp, body) => {
            var $ = cheerio.load(body);
            //version string here is going to be the update date
            var jsLink = $( ".download:contains('JavaScript.tgz')" );
            var versionString = $(jsLink).parent().next('td').text();
            req.scrapeProps.versionNo = versionString;
            next();
        });
    },
    css: function(req, res, next){
        request.get('https://kapeli.com/mdn_offline', (err, resp, body) => {
            var $ = cheerio.load(body);
            //version string here is going to be the update date
            var jsLink = $( ".download:contains('CSS.tgz')" );
            var versionString = $(jsLink).parent().next('td').text();
            req.scrapeProps.versionNo = versionString;
            next();
        });
    },
    html: function(req, res, next){
        request.get('https://kapeli.com/mdn_offline', (err, resp, body) => {
            var $ = cheerio.load(body);
            //version string here is going to be the update date
            var jsLink = $( ".download:contains('HTML.tgz')" );
            var versionString = $(jsLink).parent().next('td').text();
            req.scrapeProps.versionNo = versionString;
            next();
        });
    }
};
module.exports = versionCheck;
