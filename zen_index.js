//api key rcXpFWWM3PAuz7i8tQxXpbfL9L08mmgxT1nqNJnN
///old key
const request = require('request-promise')

//pulling current date and dividing them into month day and year
var today = new Date();
//Get Last Week's date, this takes care of all conditionals involving months
var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);

var dd = today.getDate();
var mm = today.getMonth() + 1; //January is 0!
var yy = today.getFullYear();
var lwDD = lastWeek.getDate();
var lwMM = lastWeek.getMonth() + 1;
var lwYY = lastWeek.getFullYear();

//Add leading zeroes for date formatting for the Zendesk call
if (mm < 10){
	mm = "0" + mm;
}

if (lwMM < 10){
	lwMM = "0" + lwMM;
}

var caseIDArray = [];

//Search query variables
var type = 'type:ticket';
var  status = 'status>=closed';
var afterDate = lwYY + "-" + lwMM + "-" + lwDD; // 2017-02-15
var beforeDate = yy + "-" + mm + "-" + dd; //2017-02-22

//
var options = {
 method: 'GET',
 uri: 'https://sharpspring.zendesk.com/api/v2/search.json',
 qs:{ query: 'type:ticket created<2017-02-15 created>2017-02-13 status>=closed'},
 //query: type + " created<" + beforeDate + " created>" + afterDate + " " + status},
 headers:{
   authorization:'Basic rcXpFWWM3PAuz7i8tQxXpbfL9L08mmgxT1nqNJnN'
 }

 }


request(options)
 .then(function(response){
    var resp = JSON.parse(response)
    var respLength = resp.results.length;
   for (var x = 0; x < 10; x++){
   	var randCase = Math.floor(Math.random() * (respLength + 1));
   	caseIDArray.push(resp.results[randCase].id);
   //	console.log('Find your Zen: ', resp.results[randCase].id);
   //	console.log(randCase);
   	//console.log(caseIDArray);
   }


 })
 .catch(function (err){
   console.log('not good bro', err)
 })
