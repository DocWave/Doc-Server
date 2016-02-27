'use strict';
const Update = require('./updateModel');
const path = require('path');
const fs = require('fs');

module.exports = {
  latestVer: function(req, res, next){
      let query = Update.where({sourceName: req.scrapeProps.sourceName});
      console.log(req.scrapeProps.sourceName);
      query.findOne({},{},{ sort: { 'createdAt' : -1 } }, function(err, foundVer){
          if(err) console.log(err);
          try{
            //   console.log("found ");
              let fileStats = fs.statSync(path.resolve(foundVer.filePath));
              //If we find that we have the same version, send the version we already have
              return res.sendFile(path.resolve(foundVer.filePath));
          }
          //We didn't find the file in the directory, so proceed as usual
          catch(e){
              next();
          }
          console.log(foundVer);
          return res.sendFile(path.resolve(foundVer.filePath));
      });
  },
  needUpdate : function(req, res, next){
      if(!req.needUpdate)
        req.needUpdate = {};
      let query = Update.where({versionNo: req.scrapeProps.versionNo,
                                sourceName: req.scrapeProps.sourceName});
     query.findOne( function (err, foundUpdate){
        //takes in an err from findOne and the returned Doc
        if(err) console.log(err);
        // console.log("finding");
        if(!foundUpdate){
        //no update found, send continue the middleware!
            console.log("\n\n\t\tNew version, updating\n\n");
            next();
        }

        else if ( foundUpdate ){ // if the Doc exists update
            //Also check if we have the file right now, just in case it got deleted
            try{
                console.log("found ");

                let fileStats = fs.statSync(path.resolve(foundUpdate.filePath));
                //If we find that we have the same version, send the version we already have
                //break out of the middleware!
                // console.log("\n\n\t\tFile Found, sending local copy\n\n");
                // return res.sendFile(path.resolve(foundUpdate.filePath));
                next();
            }
            //We didn't find the file in the directory, so proceed as usual
            catch(e){
                console.log("File not found....");
                console.log(foundUpdate.filePath);
                req.needUpdate[req.scrapeProps.sourceName.replace(/\s/g, "_")] = true;

                next();
            }

        }
      });
  },
  addToDB : function(req, res, next){
      //assigns a new Update document to the variable update
      let update = new Update ({sourceName : req.scrapeProps.sourceName,
                                versionNo : req.scrapeProps.versionNo,
                                filePath : req.scrapeProps.filePath,
                                retrieved : Date.now(),
                                createdAt : Date.now()});

      //store our query in a variable
      //fileName = the name of documentation
      let query = Update.where({versionNo: req.scrapeProps.versionNo,
                                sourceName: req.scrapeProps.sourceName});
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
                  }
                  else {
                      console.log (`${req.scrapeProps.sourceName} - versionNo:${req.scrapeProps.versionNo} has been added to the database.`);
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
