const express = require('express')
const request = require('request');
const logger = require('morgan')('dev');
const bodyParser = require('body-parser');
var http = require("https");
const api_key = require('./public/config/config.js');
const server  = express();



      //middlewares to handle loggging and post body
      server.use(logger);
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
        var holding
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


          var data = request(options, function (error, res, body) {
          if (error) throw new Error(error);
           console.log("api queried")

           console.log(body )

         })
          // var data = request()










        //all comments are what variables should be exactly
        // var options = {
        //   "method": "GET",
        //   "hostname": url, //"sharpspring.zendesk.com"
        //   "port": null,
        //   "path": path+'/?query='+query,///api/v2/search.json/?query=type%3Aticket%20created%3C2017-02-15%20created%3E2017-02-13%20status%3E%3Dsolved
        //   "headers": {
        //     "authorization": "Basic "+api_key,//YW5kcmEuaXNobWFlbEBzaGFycHNwcmluZy5jb206N0pqXkklb0U=
        //     "cache-control": "no-cache"
        //   }
        // };
        //
        // var req = http.request(options, function (res) {
        //
        //     var chunks = [];
        //     res.on("data", function (chunk) {
        //     chunks.push(chunk);
        //
        //   });
        //
        //   res.on("end", function () {
        //     var body = Buffer.concat(chunks);
        //     // console.log(body.toString());
        //   });
        // });
        //
        // req.end();




        //version 2 has failed as well
        // var query= data.body.query
        // var url =  data.body.url
        // var email= data.body.email
        // // var complete = url + '/?query' + query
        // var complete ={
        //       auth:email+'/token'+ api_key,
        //       host: url,
        //       path:'/?query=' + query,
        //       method: 'GET'
        // }
        // console.log(complete)

        // https.get(complete, (res) => {
        //     console.log('statusCode:', res.statusCode);
        //     console.log('headers:', res.headers);
        //
        //     res.on('data', (d) => {
        //       process.stdout.write(d);
        //     });
        //
        //   }).on('error', (e) => {
        //     console.error(e);
        //   });
        //

        // this shit fucks up my query
        // const options = {
        //     method: 'GET',
        //     uri: url,
        //     qs: {
        //       // email: email + '/token:'+api_key,
        //       query: query
        //     }
        //
        //   }
        //
        //   request(options)
        //     .then(function (rep) {
        //         console.log('Data from query: ', rep);
        //     })
        //     .catch(function (err) {
        //          console.log('close..',err)
        //     });



      }

      function listenCallBack(){
        console.log('Now Listening on port'+ server.get('port'))

      }
