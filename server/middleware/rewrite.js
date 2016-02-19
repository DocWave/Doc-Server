var cheerio = require('cheerio');

//Object for varios sites to strip out parts of html
var rewrite = {
    //Specific nodejs.com documentation removal of ToC and sidebar
    node: function(req, res, next, html){
        var $ = cheerio.load(html);
        $('#column2').remove();
        $('#toc').remove();
        $('header').remove();
        html = $.html();
        //Return full html to be written as file instead of html and cheerio data
        return html;
    },
    express: function(req, res, next, html){
        var $ = cheerio.load(html);
        $('header').remove();
        $('footer').remove();
        $('#menu').remove();
        // $('header').remove();
        html = $.html();
        //Return full html to be written as file instead of html and cheerio data
        return html;
    }

}


module.exports = rewrite;
