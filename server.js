const express = require('express')
const request = require('request');
const bodyParser = require('body-parser');
var http = require("https");
const api_key = require('./public/config/config.js');
const server  = express();



      //middlewares to handle loggging and post body
      server.use(bodyParser.json()); // support json encoded bodies
      server.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
      server.use(express.static(__dirname+'/public'));


      server.set('port', process.env.PORT || 8080);

      server.get('/', home);
      server.post('/api',makeCall);
      server.post('/test', function(req, res){
        res.send('howdy')
      })
      server.listen(server.get('port'), listenCallBack);


      //what runns things
      function home( req, res){
        res.sendFile('/html/index.html',{root:__dirname+'/public'});
      }

      function makeCall(req, res){
        console.log('Hey, I caught that info. Sending to api now.')

        var url= req.body.url
        var path=req.body.path
        var query= req.body.query

        var options = { method: 'GET',
          url: url ,//'https://sharpspring.zendesk.com/api/v2/search.json/'
          qs: { query: query  },//'type:ticket created<2017-02-15 created>2017-02-13 status>=solved'
          headers:
           { //'postman-token': 'b1fb188a-8f33-1d57-d44b-f98bc90ab4e9',
             'cache-control': 'no-cache',
             authorization: 'Basic '+api_key } };// YW5kcmEuaXNobWFlbEBzaGFycHNwcmluZy5jb206N0pqXkklb0U=


        request(options, function (error, res, body) {
          if (error) throw new Error(error);
          // console.log("api queried")

         }).pipe(res)


      }

      function grabData(req){

        var url= req.body.url
        var path=req.body.path
        var query= req.body.query

        var options = { method: 'GET',
          url: url ,//'https://sharpspring.zendesk.com/api/v2/search.json/'
          qs: { query: query  },//'type:ticket created<2017-02-15 created>2017-02-13 status>=solved'
          headers:
           { //'postman-token': 'b1fb188a-8f33-1d57-d44b-f98bc90ab4e9',
             'cache-control': 'no-cache',
             authorization: 'Basic '+api_key } };// YW5kcmEuaXNobWFlbEBzaGFycHNwcmluZy5jb206N0pqXkklb0U=


        request(options, function (error, res, body) {
          if (error) throw new Error(error);
          // console.log("api queried")

         }).on('data', function(data){
               collectBufffer += data
          }).on('end', function(){

            console.log('stream completed')
          })
          return collectBufffer
      }

      function listenCallBack(){
        console.log('Now Listening on port'+ server.get('port'))

      }
