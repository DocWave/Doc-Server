'use strict';
const Update = require('./updateModel');
const path = require('path');

module.exports = {

  needUpdate : function(req, res, next){
  let query = Update.where({version: res.versionNo});
      query.findOne( function (err, foundUpdate){
        //takes in an err from findOne and the returned Doc
        if(err)console.log(err);
        if(!foundUpdate){
        //no update found, send continue the middleware!
          next();
        }

        if ( foundUpdate ){ // if the Doc exists update
            //If we find that we have the same version, send the version we already have
            //break out of the middleware!
            return res.sendFile(path.resolve(foundUpdate.fileLocation));
        }
      });
  },
  addToDB : function(req, res, next){
    //assigns a new Update document to the variable update
    let update = new Update ({name : res.sourceName,
                              version : res.versionNo,
                              fileLocation : res.filePath,
                              retrieved : Date.now()});
                              
    //store our query in a variable
    //fileName = the name of documentation
    let query = Update.where({version: res.versionNo});

    // Checks database to see if doc already exists
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
