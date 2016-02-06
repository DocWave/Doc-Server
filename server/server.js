
'use strict';

const express = require( 'express' );
const bodyParser = require( 'body-parser' );
const path = require( 'path' );
const mongoose = require('mongoose');
const scraper = require('./scraper');
const dbController = require('./controller/dbController');
const Update = require('./controller/updateModel');
mongoose.connect('mongodb://localhost/DocTor');
const db = mongoose.connection;
const app = express();




app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'./../public')));
/////////////////////////////////////////////////
//// Handle requests to our main page(site)
/////////////////////////////////////////////////
app.get('/' , function(req, res){
  console.log("Our website homepage!");
  res.sendFile(path.join(__dirname,'/../public/index.html'));
});


/***** API *****/

/////////////////////////////////////////////////
//// Handle req for node zip
/////////////////////////////////////////////////
app.get('/node', scraper, dbController.addToDB, function(req,res){
  res.sendFile(path.resolve(res.filePath));
  console.log("sending full html back to client");
});
//////////////////////////////////////////////////
// Handle post to server add zip file update DB
//////////////////////////////////////////////////
app.post('/node', function(req, res){

  console.log('new file being posted to server');
});
//////////////////////////////////////////////////
// delete zip/or section from server update DB
//////////////////////////////////////////////////
app.delete('/node', function(req, res){

});
//////////////////////////////////////////////////
// handle changes to node update DB
//////////////////////////////////////////////////
app.put('/node', function(req, res){

});

/////////////////////////////////////////////////
//// Handle requests for data
/////////////////////////////////////////////////
app.get('/html', function(req,res){
  res.sendFile(path.join(__dirname, '/../index.html'));
  console.log("send full html back to client");
});

db.on('error', console.error.bind(console, 'connection error:'));

app.listen(3000, function(){
  console.log("Server is listening on port 3000");
});
