var fs = require('fs');
var parser = require('./parser')
var sql = require('sql.js')
var Promise = require('bluebird')


 var parseEntry = {
    allFiles: function(req, resolve, reject){
        var db = new sql.Database();
        //initialize sql query
        //move outside of function?
        var i = 0;
        //create an object to store the index and the database
        var storage = {"DB": db, "index": i};
        var sqlstr = "CREATE TABLE docsearch (ID int, NAME char, TYPE char, LINK char);";
        db.run(sqlstr)
        fs.readdir(req.scrapeProps.downloadDir, (err, file) => {
            console.log(err)
            list = file;
            // console.log(storage.DB);
            list.forEach((name) => {
                // Add directory name to file name for FS
                name = req.scrapeProps.downloadDir.concat(name);
                if(req.scrapeProps.scrapeDir.slice(0,-1) === 'node'){
                    //For node, don't parse all.html, it will break the sql
                    if(name.match(/\.html$/) && !name.match(/all\.html/)){
                        storage = parser.node(name, storage.DB, storage.index);
                    }
                }
                // console.log(req.scrapeProps.scrapeDir.slice(0,-1) === 'express');
                // console.log(name.match(/\.html$/));
                else if(req.scrapeProps.scrapeDir.slice(0,-1) === 'express'){
                    if(name.match(/\.html$/)){
                        storage = parser.express(name, storage['DB'], storage['index']);
                    }
                }
            });
            //Export the database so we can write it to file
            var data = db.export();
            //Create a buffer for writing to
            var buff = new Buffer(data);
            fs.writeFileSync(req.scrapeProps.baseDir+'/documents.sqlite', buff);

            //Be sure to resolve the promise when readdir is done
            resolve("Resolved")
        })
    }
}
module.exports = parseEntry;
