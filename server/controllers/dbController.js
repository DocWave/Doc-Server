'use strict'
module.exports = {

  addToDB : function(req, res, next){
    //update version later
    let query = {name: res.fileName, version: res.versionNo};

    Update.findOne(query, found(err, foundUpdate));

    let update = new Update ({name : res.sourceName,
                              version : res.versionNo,
                              fileLocation : res.filePath,
                              retrieved : Date.now()});

    function found(err, foundUpdate){
      if(err){
        update.save( function(err, update){
          if(err)console.error(err);
          else {
            console.log (`${res.sourceName} - version:${res.versionNo} has been added to the database.`);
            next();
          }
        });
      }
      if ( foundUpdate ){
        foundUpdate.findOneAndUpdate(query, {retrieved: Date.now()}, function(err, newInfo){
          if (err) console.log(err);
          else{
            console.log(newInfo);
            next();
          }
        });
      }
    }
  }
};
