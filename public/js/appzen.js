$(document).ready(function($){
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


// getting the current case id
var currentCaseID = 101;
//Search query variables
var type = 'type:ticket';
var status = 'status>=solved';
var afterDate = lwYY + "-" + lwMM + "-" + lwDD; // 2017-02-15
var beforeDate = yy + "-" + mm + "-" + dd; //2017-02-22


//this fires the whole thing
//button listeners
 $('#click').on('click', getTickets)


//build out url
function buildQuery(){
  //type + " created<" + beforeDate + " created>" + afterDate + " " + status
  type + " created<" + beforeDate + " created>" + afterDate + " " + status

  var queryString = type + " created<" + beforeDate + " created>" + afterDate + " " + status
//'type:ticket created<2017-02-15 created>2017-02-13 status>=solved'//'type:ticket+created<2017-02-15+created>2017-02-13+status>=solved'
  console.log( 'query build completed') //used for testing url structure
  return  queryString
}

//Makes first api call to collect csases
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

//logs errors to console
function errorHandler(err){
    console.log('Well that sucks',err);
}

// When Call is completed this runs calls xpat to randomly select 10 cases
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



//sorting function to grab 10 random cases. Break case loop out into its own function
function xpat(allDat){
   console.log('xpat is running and has data')
    var resp = allDat
    var respLength = resp.results.length
    var caseIDArray = cycleThrough(resp)
  //old version
  // var caseIDArray =  []
  //  for (var x = 0; x < 10; x++){
  //  	var randCase = Math.floor(Math.random() * (respLength + 1));
  //  	caseIDArray.push(resp.results[randCase].id);
   // 	console.log('Find your Zen: ', resp.results[randCase].id);
   // 	console.log(randCase);


   return caseIDArray
}

//function to handle random case selection
function cycleThrough(resp){
   var idArray = []
   var respLength = resp.results.length
   for (var x = 0; x < 10; x++){
   	   var randCase = Math.floor(Math.random() * (respLength + 1));
   	   idArray.push(resp.results[randCase].id);
    }
    return idArray
}

//part 2
//on click the  case number is collceted and sent to the function to build the display
$('#output').on('click', function(event){
    var caseid =event.target.id
    singleCase(caseid)
  })

//sends the request for the singular case
function singleCase(caseid){
    console.log("Collecting single case")
      currentCaseID = caseid
     var query = {id :caseid }
     $.ajax({
          type: 'post',
          url: '/api2',
          data: query,
          success: doit,
          dataType: 'json'
        });
}



//this will be called by another function when case information is colected
function doit(data){
  var comments = data.comments
  var total = data.comments.length
  var roleAgent = data.users.find(findAgent)  //findAgent(data.users)
  var user = {
       agent:roleAgent.name,
       email:roleAgent.email,
       id:roleAgent.id
  }
  var fullthread = buildComment(comments, total) //[]
  // console.log(data.users[0].role)
  // console.log(roleAgent)

  showTime2(fullthread,user)

}

//simply builds the thread that gets displayed to the front end
function buildComment(comments, total){
     var thread= []

  for (var x = 0; x < total; x++){
      thread.push(comments[x].body)
  }
     return thread
}
//cycles through users on a case to find agent
function findAgent(users){
     return users.role === "agent"
}

//is called by doit function to display data for agent and case
 function showTime2(data,user){

   var caseInfo ={ comment: data,
                    agent: user.agent,
                    email: user.email,
                    case: currentCaseID
                   }
   var source = $('#part2').html()
   var template = Handlebars.compile(source)
   var html = template(caseInfo)

   $('#output2').html(html);
 }



})










// //working
// https://sharpspring.zendesk.com/api/v2/search.json?query=type:ticket+created%3C2017-02-15+created%3E2017-02-13+status%3E=closed
//
// https://sharpspring.zendesk.com/api/v2/search.json?query=type:ticket+created%3C2017-02-15+created%3E2017-02-13+status%3E=closed
