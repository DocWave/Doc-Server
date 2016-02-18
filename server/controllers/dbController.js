'use strict';
const Update = require('./updateModel');
const path = require('path');
const fs = require('fs');

module.exports = {

  needUpdate : function(req, res, next){
      let query = Update.where({versionNo: req.versionNo});
      query.findOne( function (err, foundUpdate){
        //takes in an err from findOne and the returned Doc
        if(err)console.log(err);
        // console.log(foundUpdate, "FOUND IT");
        if(!foundUpdate){
        //no update found, send continue the middleware!
            console.log("\n\n\t\tNew version, updating\n\n");
          next();
        }

        if ( foundUpdate ){ // if the Doc exists update
            //Also check if we have the file right now, just in case it got deleted
            try{
                let fileStats = fs.statSync(path.resolve(foundUpdate.filePath));
                //If we find that we have the same version, send the version we already have
                //break out of the middleware!
                console.log("\n\n\t\tFile Found, sending local copy\n\n");
                return res.sendFile(path.resolve(foundUpdate.filePath));
            }
            //We didn't find the file in the directory, so proceed as usual
            catch(e){
                // console.log("File not found", e);
                next();
            }

        }
      });
  },
  addToDB : function(req, res, next){
    //assigns a new Update document to the variable update
    let update = new Update ({sourceName : req.sourceName,
                              versionNo : req.versionNo,
                              filePath : req.filePath,
                              retrieved : Date.now()});

    //store our query in a variable
    //fileName = the name of documentation
    let query = Update.where({versionNo: req.versionNo});
    // console.log(res.fileName, res.versionNo, res.filePath);
    //Checks database to see if doc already exists
    // runs callback found(err,foundUpdate)

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
            console.log (`${req.sourceName} - versionNo:${req.versionNo} has been added to the database.`);
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
