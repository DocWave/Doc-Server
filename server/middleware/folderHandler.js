var fs = require('fs');

var folderHandler = {
    createFolder: function(path){
        if(this.checkFolders(path)){
            console.log("Folder exists for zip file, continue");
        }
        else{
            fs.mkdir(path, err => {
                console.log("Folder does not exits, creating");
                console.log(err);
            })
        }
    },
    checkToDelete: function(path){
        // if the diretory exists, delete it
        if(this.checkFolders(path)){
            //We need to delete the directory
            console.log("Folder existed, deleting")
            this.deleteFolderRecursive(path);
        }
        else{
            console.log("Folder does not exist, continuing");
        }
    },
    //Generic function to check if folder exists
    checkFolders: function(path){
        var that = this;
        // Use try, if dir does not exist, it will throw an error
        try{
            var stats = fs.statSync(path)
            if(stats.isDirectory()){
                return true;
            }
        }
        catch(err){
            if(err){
                // console.log(err, 'Folder does not exist');
                return false
            }
        }
    },
    //Recursively delete folders   should I make it async?
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
