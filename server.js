const express = require('express')
const request = require('request');
const bodyParser = require('body-parser');
const http = require("https");
const api_key = require('./public/config/config.js');
const server  = express();
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const dbURl = 'mongodb://127.0.0.1:27017/myproject';



      //middlewares to handle loggging and post body
      server.use(bodyParser.json()); // support json encoded bodies
      server.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
      server.use(express.static(__dirname+'/public'));


      server.set('port', process.env.PORT || 8080);

      server.get('/', home);
      server.post('/api',makeCall);
      server.post('/api2', commentUser);
      server.post('/reviewed', reviewResponse)
      server.listen(server.get('port'), listenCallBack);


      //sends index file when called
      function home( req, res){
        res.sendFile('/html/index.html',{root:__dirname+'/public'});
      }
      //makes first call to api to grab cases
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

      //second call to api to collect tickets and user
      function commentUser(req,res){
         var id = req.body.id
         var cuURl = 'https://sharpspring.zendesk.com/api/v2/tickets/'+id+'/comments.json?include=users'
         var options ={
           method: 'GET',
           url: cuURl,
           headers:
            { //'postman-token': 'b1fb188a-8f33-1d57-d44b-f98bc90ab4e9',
              'cache-control': 'no-cache',
              authorization: 'Basic '+api_key
            } };// YW5kcmEuaXNobWFlbEBzaGFycHNwcmluZy5jb206N0pqXkklb0U=

          request(options, function (error, res, body) {
              if (error) throw new Error(error);
              // console.log("api queried", body) for testing

             }).pipe(res)

      }


      //deals with form data
      function reviewResponse(req, res ){
          var formData = req.body
          console.log(formData)
          MongoClient.connect(dbURl, function(err, db) {
            assert.equal(null, err);
            //function goes here to write to database

            console.log("Connected successfully to server");
            insertDocuments(db, formData, function(){
                db.close();
            });

          });

      }


      //sends information to collection
      function insertDocuments(db , data, callback){

        //call current collection
        var collection = db.collection('myDocuments')

        //add record TODO:add variables references
        collection.insertOne({email: "email" , name: 'name', reviewedCase: 'case', reveiwedName: 'agentName', effort: 0, knowledge: 0, softskill:0, overall: 0, comment: "string string"},
        //handles errrot and does sopme minor checking for issues
        function(err, result) {
           assert.equal(err, null);
           assert.equal(1, result.result.n);
           assert.equal(1, result.ops.length);
           console.log("Inserted 1 document into the collection");
           callback(result);

         });

      }

     //logs out to console
      function listenCallBack(){
        console.log('Now Listening on port:'+ server.get('port'))

      }
