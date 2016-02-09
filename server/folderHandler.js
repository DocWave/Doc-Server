var fs = require('fs');

var folderHandler = {

    checkFolders: function(path){
        var that = this;
        // Use try, if dir does not exist, it will throw an error
        try{
            var stats = fs.statSync(path)
            if(stats.isDirectory()){
                console.log("Deleting directory");
                that.deleteFolderRecursive(path);
            }
        }
        catch(err){
            if(err) console.log(err, 'Folder does not exist, continuing');
        }
    },
    //Recursively delete folders
    deleteFolderRecursive: function(path) {
        var that = this;
        if( fs.existsSync(path) ) {
            fs.readdirSync(path).forEach(function(file,index){
                var curPath = path + "/" + file;
                if(fs.lstatSync(curPath).isDirectory()) { // recurse
                    that.deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }
}

module.exports = folderHandler;
