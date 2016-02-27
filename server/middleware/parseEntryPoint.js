var fs = require('fs');
var parser = require('./parser');
// var sql = require('sql.js')


 var parseEntry = {
    allFiles: function(req, resolve, reject){
        // var db = new sql.Database();
        //initialize sql query
        //move outside of function?
        var i = 0;
        var jsonFile = {"sourceName": req.scrapeProps.sourceName,
            "versionNo": req.scrapeProps.versionNo, "result": []};
        //create an object to store the index and the database
        // var storage = {"DB": db, "index": i};
        // var sqlstr = "CREATE TABLE docsearch (ID int, NAME char, TYPE char, LINK char);";
        // db.run(sqlstr)
        fs.readdir(req.scrapeProps.downloadDir, (err, file) => {
            console.log(err);
            list = file;
            // console.log(storage.DB);
            list.forEach((name) => {
                // Add directory name to file name for FS
                name = req.scrapeProps.downloadDir.concat(name);
                if(req.scrapeProps.scrapeDir.slice(0,-1) === 'node'){
                    //For node, don't parse all.html, it will break the sql
                    if(name.match(/\.html$/) && !name.match(/all\.html/)){
                        jsonFile = parser.node(name, jsonFile);
                    }
                }
                //Express stuff here
                else if(req.scrapeProps.scrapeDir.slice(0,-1) === 'express'){
                    if(name.match(/\.html$/)){
                        jsonFile = parser.express(name, jsonFile);
                    }
                }
            });
            //Export the database so we can write it to file
            // var data = db.export();
            //Create a buffer for writing to
            // var buff = new Buffer(data);
            jsonFile = JSON.stringify(jsonFile);
            fs.writeFileSync(req.scrapeProps.baseDir+'/index.json', jsonFile);
            //Null out jsonFile
            jsonFile = null;
            //Be sure to resolve the promise when readdir is done
            resolve("Resolved");
        })
    }
}
module.exports = parseEntry;
