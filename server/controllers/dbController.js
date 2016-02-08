'use strict';
module.exports = {

  addToDB : function(req, res, next){
    //assigns a new Update document to the variable update
    console.log("I run");
    let update = new Update ({name : res.sourceName,
                              version : res.versionNo,
                              fileLocation : res.filePath,
                              retrieved : Date.now()});
    //store our query in a variable
    //fileName = the name of documentation
    console.log(update);
    let query = {name: res.fileName, version: res.versionNo};

    //Checks database to see if doc already exists
    // runs callback found(err,foundUpdate)
    Update.findOne(query, found(err, foundUpdate));

    //takes in an err from findOne and the returned Doc
    function found(err, foundUpdate){
      if(err){
        //will save doc on any err
        //...could be problematic
        console.log(err);
      }
      if(foundUpdate===null && err){
        update.save( function(err, update){
          if(err)console.error(err);
          else {
            console.log (`${res.sourceName} - version:${res.versionNo} has been added to the database.`);
            next();
          }
        });
      }
      if ( foundUpdate ){ // if the Doc exists update
        //currently only updating the Date
        // we can handle version numbers at a later date
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
