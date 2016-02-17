var request = require('request');
var cheerio = require('cheerio');

var versionCheck = {
    node: function(req, res, next){
        //Grab front page of node and check the version number;
        request.get('https://nodejs.org/api/index.html', (err, resp, body) =>{
            var $ = cheerio.load(body);
            var temp = $('header h1').text();
            temp = temp.match(/\sv.*\s/)[0].trim().slice(1);
            req.versionNo = temp;
            next();
        });
    },
}
module.exports = versionCheck;
