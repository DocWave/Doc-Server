'use strict';

const express = require( 'express' );
const bodyParser = require( 'body-parser' );
const path = require( 'path' );
const scraper = require('./scraper');
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
app.get('/node', function(req,res){
  res.sendFile(path.resolve('server/node.zip'));
  console.log("sending full html back to client");
});

app.get('/html', function(req,res){
  res.sendFile(path.join(__dirname, '/../index.html'));
  console.log("send full html back to client");
});

app.get('/test', scraper, function(req, res, next){
    res.sendFile(res.output);
});


app.listen(3000, function(){
  console.log("Server is listening on port 3000");
});
