const express = require('express')
const request = require('request');
const bodyParser = require('body-parser');
const http = require("https");
const api_key = require('./public/config/config.js');
const mj_key = require ('./public/config/mailjet.js');
const mj_secret= require ('./public/config/mailjetSec.js');
const mailjet = require ('node-mailjet').connect(mj_key,mj_secret);
const mongopass = require('./public/config/mongo.js')
const mjRequest = mailjet
const server  = express();
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const dbURl = 'mongodb://adminLP:'+mongopass+'@cluster0-shard-00-00-5pp3g.mongodb.net:27017,cluster0-shard-00-01-5pp3g.mongodb.net:27017,cluster0-shard-00-02-5pp3g.mongodb.net:27017/peerReviews?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin'
//local url for testing 'mongodb://127.0.0.1:27017/myproject'; //live url////' mongodb://adminLP:'+mongopass+'@cluster0-shard-00-00-5pp3g.mongodb.net:27017,cluster0-shard-00-01-5pp3g.mongodb.net:27017,cluster0-shard-00-02-5pp3g.mongodb.net:27017/peerReviews?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin'

      //globals
        var reviewData=[]




      //middlewares to handle loggging and post body
      server.use(bodyParser.json()); // support json encoded bodies
      server.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
      server.use(express.static(__dirname+'/public'));


      server.set('port', process.env.PORT || 8080);

      server.get('/', home);
      server.get('/pamzenfu', function(req,res){
        res.sendFile('/html/pampage.html',{root:__dirname+'/public'});
      })
      server.post('/giphyThanks', giphyCall)
      server.get('/test', displayReview)
      server.post('/db', displayReview)
      server.post('/api',makeCall);
      server.post('/api2', commentUser);
      server.post('/reviewed', reviewResponse)


      server.listen(server.get('port'), listenCallBack);

       //for testing purposes
      // server.get('/mailtest', function(){
      //      var  email={
      //                   "FromEmail":"andra.ishmael@sharpspring.com",
      //                   "FromName":"Mailjet Pilot",
      //                   "Subject":"Your email flight plan!",
      //                   "Text-part":"Dear passenger, welcome to Mailjet! May the delivery force be with you!",
      //                   "Html-part":"<h3>Dear passenger, welcome to Mailjet!</h3><br />May the delivery force be with you!",
      //                   "Recipients":[{"Email":"ishmaelak@gmail.com"}]
      //                  }
      //
      //     var sendMail = mjRequest.post("send").request(email)
      //
      //     sendMail.then(result =>{
      //           console.log(result.body)
      //     })
      //     .catch(err => {
      //       console.log(err.statusCode)
      //     })
      // })

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
             authorization: 'Basic '+api_key } };


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
            } };
          request(options, function (error, res, body) {
              if (error) throw new Error(error);
              // console.log("api queried", body) for testing

             }).pipe(res)

      }
      //Third call to zen desk to tag case as reviewed
      function addtag(data){
        var tagUrl= "https://sharpspring.zendesk.com/api/v2/tickets/"+data.case+"/tags.json"
        var options ={
          method: 'PUT',
          url: tagUrl,
          data: { "tags": ["Peer_reviewed"] } ,
          headers:
           {
             'cache-control': 'no-cache',
             authorization: 'Basic '+api_key
           } };
         request(options, function (error, res, body) {
             if (error) throw new Error(error);
             // console.log("api queried", body) for testing

            })

      }


      //inserts data into data base
      function reviewResponse(req, res){
          var formData = req.body
          addtag(formData) //should work test later
          notify(formData)
          console.log(formData)
          MongoClient.connect(dbURl, function(err, db) {
            assert.equal(null, err);
            console.log("Connected successfully to server");
            insertDocuments(db, formData, function(){
                db.close();
            });

          });

          res.sendFile('/html/thanks.html',{root:__dirname+'/public'});


      }


      //sends information to collection
      function insertDocuments(db , data, callback){
        var average= mathWork(data)
        var subDate = new Date().toDateString()
        //call current collection
        var collection = db.collection('weeklyReview')

        //add record ß
        collection.insertOne({submissonDate: subDate,email: data.email , firstName:data.firstname, lastName:data.lastname, reveiwedName: data.Rname, case: data.case, Interpretation:data.interpretation ,effort: data.Effort, knowledge: data.knowledge, softskill: data.soft_skills,responsiveness: data.responsiveness, overall: average, commentDoWell:data.doWell, commentImprove: data.improve, commentDifferent:data.diff, commentLearn: data.learn },
        //handles error and does sopme minor checking for issues
        function(err, result) {
           assert.equal(err, null);
           assert.equal(1, result.result.n);
           assert.equal(1, result.ops.length);
           console.log("Inserted 1 document into the collection");
           callback(result);

         });

      }
     //collect reveiws from datbase
     function displayReview(req, res){


             MongoClient.connect(dbURl, function(err, db){
              //  var cursor= db.collection('weeklyReview').find()
            db.collection('weeklyReview').find().toArray(function(err, results){
                res.send(results)
              })

                })
                //  console.log(reviewData)
                //   res.send(reviewData)

     }

     function print(){
       console.log(reviewData)

     }


      //calculates average of all response
      function mathWork(data){
        var interp = parseInt(data.interpretation),
             knowledge =   parseInt(data.knowledge),
             effort = parseInt(data.Effort),
             skills =parseInt(data.soft_skills),
             resp = parseInt(data.responsiveness)
             console.log(resp)
        var total = interp + knowledge + effort + skills +resp
        var average = total / 4
          return average
      }

      //sends email to reviewed agent
      function notify(data){
          var avgScore= mathWork(data)


           var  email={
                        "FromEmail":"sspeerreview@gmail.com",
                        "FromName":"Super Support",
                        "Subject":"One of your cases got reviewed!!",
                        "Text-part":"!",
                        "Html-part":  "<h3>Hey, "+data.firstname+" reviewed case#: "+data.case+"!</h3>Average Score: "+avgScore+"<br>knowledge: "+data.knowledge+"<br>Effort: "+data.Effort+"<br>Interpretation: "+data.interpretation+"<br>Soft Skills: "+data.soft_skills+"<br>Responsiveness:"+data.responsiveness+"<br>What you did well: <br><br>"+data.doWell+"<br> What you can imporve:<br><br>"+data.improve+"<br>What they would have done differently:<br><br>"+data.diff+"<br>What they learned from your case:<br><br>"+data.learn,
                        "Recipients":[{"Email":data.Remail}]
                       }

          //  console.log("disabled temporarly",email)
          var sendMail = mjRequest.post("send").request(email)

          sendMail.then(result =>{
                console.log(result.body)
          })
          .catch(err => {
            console.log(err.statusCode)
          })
      }

      //collects random gif from giphy api
      function giphyCall(req, res){
        var options ={
          method: 'GET',
          url: 'http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&rating=pg-13' };
         request(options, function (error, res, body) {
             if (error) throw new Error(error);

           }).pipe(res)
      }

     //logs out to console
      function listenCallBack(){
        console.log('Now Listening on port: '+ server.get('port'))

      }
