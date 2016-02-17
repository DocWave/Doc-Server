var fs = require('fs');
var parser = require('./nodeparser_working')
var sql = require('sql.js')
var Promise = require('bluebird')


 var parseEntry = {
    allFiles: function(baseDir, downloadDir, resolve, reject){
        // var folder = [];
        var db = new sql.Database();
        //initialize sql query
        //move outside of function?
        var i = 0;
        //create an object to store the index and the database
        var storage = {"DB": db, "index": i};
        var sqlstr = "CREATE TABLE docsearch (ID int, NAME char, TYPE char, LINK char);";
        db.run(sqlstr)
        fs.readdir(downloadDir, (err, file) => {
            list = file;
            list.forEach((name) => {
                // Add directory name to file name for FS
                name = downloadDir.concat(name);
                //For node, don't parse all.html, it will break the sql
                if(name.match(/\.html$/) && !name.match(/all\.html/)){
                    storage = parser(name, storage.DB, storage.index);
                }
            });
            //Export the database so we can write it to file
            var data = db.export();
            //Create a buffer for writing to
            var buff = new Buffer(data);
            fs.writeFileSync(baseDir+'/documents.sqlite', buff);

            //Be sure to resolve the promise when readdir is done
            resolve("Resolved")
        })
    }
}
module.exports = parseEntry;
