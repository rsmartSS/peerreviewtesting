$(document).ready(function($){
//Globals


//base uri
const baseUrl = 'https://sharpspring.zendesk.com/api/v2/search.json/'
// const path = '/api/v2/search.json/' no longer necesarry

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

//Search query variables
var type = 'type:ticket';
var status = 'status>=solved';
var afterDate = lwYY + "-" + lwMM + "-" + lwDD; // 2017-02-15
var beforeDate = yy + "-" + mm + "-" + dd; //2017-02-22


//this fires the whole thing
//button listeners
 $('#click').on('click', getTickets)


//build out url, currently will be hard set for testing
function buildQuery(){
  //type + " created<" + beforeDate + " created>" + afterDate + " " + status
  type + " created<" + beforeDate + " created>" + afterDate + " " + status

  var queryString = type + " created<" + beforeDate + " created>" + afterDate + " " + status
//'type:ticket created<2017-02-15 created>2017-02-13 status>=solved'//'type:ticket+created<2017-02-15+created>2017-02-13+status>=solved'
  console.log( 'query build completed') //used for testing url structure
  return  queryString
}

//firing dreaded ajax call
function getTickets(){

    var search = {
          query: buildQuery(),
          url: baseUrl,
    }
    var searchstr= JSON.stringify(search)

    $.ajax({
          type: 'post',
          url: '/api',
          data: search,
          success: zenCall,
          dataType: 'json'
        });




}
function testCapture(data){
  console.log('all I want is data here',data)
}
//logs errors to console
function errorHandler(err){
    console.log('Well that sucks',err);
}

// When Call is completed this runs
function zenCall(data){
    var allDat = data
    var source= $('#showTime').html();
    var template= Handlebars.compile(source);
    var caseArray = xpat(allDat)
    var data ={
      case: caseArray
    }
    var html = template(data);

    // console.log( 'zen call has comenced', allDat.results[0].id) for testing

    $('#output').html(html);



};

//sorting function to grab 5 random cases
function xpat(allDat){
   console.log('xpat is running and has data')
    var resp = allDat
    var respLength = resp.results.length
    var caseIDArray = []
   for (var x = 0; x < 10; x++){
   	var randCase = Math.floor(Math.random() * (respLength + 1));
   	caseIDArray.push(resp.results[randCase].id);
   // 	console.log('Find your Zen: ', resp.results[randCase].id);
   // 	console.log(randCase);

   }

   return caseIDArray
}





})




// //working
// https://sharpspring.zendesk.com/api/v2/search.json?query=type:ticket+created%3C2017-02-15+created%3E2017-02-13+status%3E=closed
//
// https://sharpspring.zendesk.com/api/v2/search.json?query=type:ticket+created%3C2017-02-15+created%3E2017-02-13+status%3E=closed
