const express = require('express')
const request = require('request');
const bodyParser = require('body-parser');
const http = require("https");
const api_key = require('./public/config/config.js');
const mj_key = require ('./public/config/mailjet.js');
const mj_secret= require ('./public/config/mailjetSec.js');
const mailjet = require ('node-mailjet').connect(mj_key,mj_secret);
const mongopass = require('./public/config/mongo.js');
const mjRequest = mailjet;
const server  = express();
const mongo =require('mongodb')
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const dbURl = 'mongodb://adminLP:'+mongopass+'@cluster0-shard-00-00-5pp3g.mongodb.net:27017,cluster0-shard-00-01-5pp3g.mongodb.net:27017,cluster0-shard-00-02-5pp3g.mongodb.net:27017/peerReviews?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin'
//local url for testing 'mongodb://127.0.0.1:27017/myproject'; //live url////' mongodb://adminLP:'+mongopass+'@cluster0-shard-00-00-5pp3g.mongodb.net:27017,cluster0-shard-00-01-5pp3g.mongodb.net:27017,cluster0-shard-00-02-5pp3g.mongodb.net:27017/peerReviews?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin'

      //globals
        var reviewData
        var staffData




      //middlewares to handle loggging and post body
      server.use(bodyParser.json()); // support json encoded bodies
      server.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
      server.use(express.static(__dirname+'/public'));


      server.set('port', process.env.PORT || 8080);

      server.get('/', home);
      server.get('/smview', function(req,res){
        res.sendFile('/html/pampage.html',{root:__dirname+'/public'});
      })
      server.post('/giphyThanks', giphyCall)
      server.get('/test', displayReview)
      server.post('/db', displayReview)
      server.post('/staffDb',getUsers)
      server.post('/api',makeCall);
      server.post('/api2', commentUser);
      server.post('/reviewed', reviewResponse)
      server.post('/flag', flagCase)


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
      //Third call to zen desk to tag case as reviewed this is currently not working
      function addtag(data){
        var tagUrl= "https://sharpspring.zendesk.com/api/v2/tickets/"+data.case+"/tags.json"
        var options ={
          method: 'PUT',
          url: tagUrl,
          body: { tags: ["Peer_reviewed"] } ,
          json: true,
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
      //sends to zappier https://hooks.zapier.com/hooks/catch/2144011/9rfa6m/
      function zapPost(data){
         let checkmate= {
              firstname:data.agent.split(" ")[0],
              lastname:data.agent.split(" ")[1],
              email:data.agent.split(" ")[2],
              alld:data
         }
         let options ={
            method:'POST',
            url:'https://hooks.zapier.com/hooks/catch/2144011/9rfa6m/',
            body:{
              form:checkmate
            },
           json:true

         }

         request(options, function(error, res, body){
           if(error) throw new Error(error);
           console.log("zapp send",body)
         })


      }


      //inserts data into data base
      function reviewResponse(req, res){
          var formData = req.body
          addtag(formData) //should work test later
          notify(formData)
          zapPost(formData)
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
        // var average= mathWork(data) //obselete
        var subDate = new Date().toDateString()
        var firstname = data.agent.split(" ")[0];
        var lastname = data.agent.split(" ")[1];
        var email = data.agent.split(" ")[2]
        //call current collection
        var collection = db.collection('weeklyReview2')

        //add record
        //old// collection.insertOne({submissonDate: subDate,email: data.email , firstName:firstname, lastName:lastname, reveiwedName: data.Rname, case: data.case, Interpretation:data.interpretation ,effort: data.Effort, knowledge: data.knowledge, softskill: data.soft_skills,responsiveness: data.responsiveness, overall: average, commentDoWell:data.doWell, commentImprove: data.improve, commentDifferent:data.diff, commentLearn: data.learn },
        collection.insertOne({submissonDate: subDate,email:email , firstName:firstname, lastName:lastname, reveiwedName: data.Rname, case: data.case, understand:data.understand, helpArticle:data.helpArticle, correctArticle:data.correctArticle, verifyArticle:data.verifyArticle, eraser:data.eraser, effectively: data.effectively, wasitnecessary: data.doubt,courtesy: data.courtesy,responsiveness: data.responsive, call: data.call, knowledgeable: data.knowledgeable , overall: data.overall, whyOverall: data.why, improve: data.improve,flag:false},

        //handles error and does some minor checking for issues
        function(err, result) {
           assert.equal(err, null);
           assert.equal(1, result.result.n);
           assert.equal(1, result.ops.length);
           console.log("Inserted 1 document into the collection");
           //set function here for search
           callback(result);

         });

         checkfive(firstname, lastname)
      }


     //collect reveiws from datbase
     function displayReview(req, res){
             MongoClient.connect(dbURl, function(err, db){
              //  var cursor= db.collection('weeklyReview').find()
            db.collection('weeklyReview2').find().toArray(function(err, results){
                res.send(results)
              })

                })
     }

     //collects staff currently in db
     function getUsers(req, res) {
       MongoClient.connect(dbURl, function(err, db){
        //  var cursor= db.collection('weeklyReview').find()
        db.collection('supportStaff').find().toArray(function(err, results){
          res.send(results)
        })
          })
     }

     //filter subs by name and submission date to notify people they have hit 5 reviews
     function checkfive(fname, Lname){
       MongoClient.connect(dbURl, function(err, db){
        db.collection('weeklyReview2').find({firstName:fname,lastName:Lname}).toArray(function(err, results){
          var five =[]
          let monday = getMonday(new Date())
          let friday =  getMonday(new Date())
          new Date(friday.setDate(monday.getDate()+5))
          // console.log("monday", monday)
          // console.log("Friday",friday)
           // date filter
           for(x = 0; x < results.length; x++){
              let caseDate = new Date(results[x].submissonDate)
              if(caseDate <= friday && caseDate>=monday){
                five.push(results[x])
              }
            }
            if(five.length == 5){
              console.log("You have hit 5 cases")
              // call notification email
               notifyLimit(five[0])
               noitfySlack(five[0])
            }
            else{
               console.log("you still have cases to go this week")
               console.log(five.length)


            }

        })

          })
     }

    // generates the monday date automaticly
     function getMonday(date){
       let d = new Date(date);
       let day = d.getDay(),
           diff = d.getDate() - day + (day == 0? -6:1)

        return new Date(d.setDate(diff))
     }



//sends email to reviewed agent
      function notify(data){
           var  email={
                        "FromEmail":"sspeerreview@gmail.com",
                        "FromName":"PS Peer Review",
                        "Subject":"One of your cases was reviewed!!",
                        "Text-part":"!",
                        "Html-part":  "<h3>Hey, someone reviewed case#: "+data.case+"!</h3>Average Score: "+avgScore+"<br>knowledge: "+data.knowledge+"<br>Effort: "+data.Effort+"<br>Interpretation: "+data.interpretation+"<br>Soft Skills: "+data.soft_skills+"<br>Responsiveness:"+data.responsiveness+"<br>What you did well: <br><br>"+data.doWell+"<br> What you can improve:<br><br>"+data.improve+"<br>What they would have done differently:<br><br>"+data.diff+"<br>What they learned from your case:<br><br>"+data.learn,
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
      // sends email when 5 cases have been reviewed
      function notifyLimit(data){

           var  email={
                        "FromEmail":"sspeerreview@gmail.com",
                        "FromName":"PS Peer Review",
                        "Subject":"You have Reviewed 5 Cases!!",
                        "Text-part":"Just letting you know that you have reviewed 5 cases this week",
                        "Recipients":[{"Email":data.email}]
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

      function notifySlack(data){
        // console.log(data)
        //   var data
        //   data.firstName = "testing"
        //   data.lastName = "123"
        // text:data.firstName+" "+data.lastName+" has completed 5 Reviews this week"

        let options ={
           method:'POST',
           url:'https://hooks.slack.com/services/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',
           body:{
              text:data.firstName+" "+data.lastName+" has commpleted 5 reviews this week!"

           },
          json:true

        }

        request(options, function(error, res, body){
          if(error) throw new Error(error);
          console.log("slack send",body)
        })

      }


      //function flags individual case
      function flagCase(data){
        let objectId = new mongo.ObjectId(data.body.id)
        let objectValue= (data.body.val == 'true')
        console.log(objectValue)

        MongoClient.connect(dbURl, function(err, db){
          var cursor= db.collection('weeklyReview').find()
           db.collection('weeklyReview2').updateOne({_id: objectId}, {$set: {flag:objectValue} }, function(err,r){
              console.log(err)
              })


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
