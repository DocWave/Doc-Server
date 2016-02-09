'use strict';
const Update = require('./updateModel');


module.exports = {

  addToDB : function(req, res, next){
    //assigns a new Update document to the variable update
    let update = new Update ({name : res.sourceName,
                              version : res.versionNo,
                              fileLocation : res.filePath,
                              retrieved : Date.now()});
    //store our query in a variable
    //fileName = the name of documentation
    console.log(update);
    let query = Update.where({version: res.versionNo});
    // console.log(res.fileName, res.versionNo, res.filePath);
    //Checks database to see if doc already exists
    // runs callback found(err,foundUpdate)

    query.findOne( function (err, foundUpdate){
      //takes in an err from findOne and the returned Doc
      if(err)console.log(err);

      if(!foundUpdate){
        update.save( function(err, update){
          if(err) {
            console.error(err);
          }else {
            console.log (`${res.sourceName} - version:${res.versionNo} has been added to the database.`);
            next();
          }
        });
      }

      if ( foundUpdate ){ // if the Doc exists update
        //currently only updating the Date - can handle version numbers at a later date
        query.findOneAndUpdate( {retrieved: Date.now()}, function(err, newInfo){
          if (err) console.log(err);
          else{
            console.log("NewInfo ", newInfo);
            next();
          }
        });
      }
    });
  }
};
