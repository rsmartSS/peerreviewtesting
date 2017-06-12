$(document).ready(function($){
//activate tooltips
$('[data-toggle="tooltip"]').tooltip();

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
var currentAssignee
var allReviews
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
  // type + " created<" + beforeDate + " created>" + afterDate + " " + status

  var queryString = type + " created<" + beforeDate + " created>" + afterDate + " " + status
//'type:ticket created<2017-02-15 created>2017-02-13 status>=solved'//'type:ticket+created<2017-02-15+created>2017-02-13+status>=solved'
  console.log( 'query build completed') //used for testing url structure
  return  queryString
}

//Makes first api call to collect csases
function getTickets(){
  $("#loader").toggle(100)

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
          error: errorHandler2,
          dataType: 'json'
        });

}

//logs errors to console
function errorHandler(err){
    console.log('Well that sucks',err);
}
//triggers popup on the page'
function errorHandler2(err){
  console.log("api's not resopnding", err)
  $('#apiError').modal('toggle')

}

// When Call is completed this runs calls xpat to randomly select 10 cases
function zenCall(data){
    $("#loader").toggle(100)
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

   return caseIDArray
}

//function to handle random case selection
function cycleThrough(resp){
   var idArray = []
   var respLength = resp.results.length
   try {
     for (var x = 0; x < 10; x++){
     	   var randCase = Math.floor(Math.random() * (respLength + 1)) || 42

         var caseGroup = findGroup(resp.results[randCase].group_id) || null
         var caseTag = findTag(resp.results[randCase].tags) || null

         if(caseGroup || caseTag){
           x = x - 1
         }
         else{
            idArray.push({id:resp.results[randCase].id,assignee:resp.results[randCase].assignee_id});
         }
      }
      return idArray
   } catch (e) {
       alert("Error encountered, try refreshing the browser.",e)
       console.log(e)
   }
}
function findTag(tags){
    for(let x; x < tags.length; x++){
       if(tags[x] == "Peer_reviewed"){
        return tags[x]
       }
       else{
         console.log("clear")
       }

    }
}
function findGroup(group){
    if(group == 33728027 || group == 33764028 || group == 33763688 || group == 33764048 || group == 33764088 || group == 33728067 || group == 33779667){
      return null
    }
    else{
      console.log('removed',group)
      return group
    }
 }

//part 2
//on click the  case number is collceted and sent to the function to build the display
$('#output').on('click', function(event){
    var caseid =event.target.id
    currentAssignee = event.target.name
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
          error: errorHandler,
          dataType: 'json'
        });
}



//this will be called by another function when case information is colected
function doit(data){
  var comments = data.comments
  var total = data.comments.length
  var roleAgent= findAgent(data.users)
  var user = {
       agent:roleAgent.name,
       email:roleAgent.email,
       id:roleAgent.id
  }
  var fullthread = buildComment(comments, total) //[]
  // console.log(fullthread)
  showTime2(fullthread,user)

}

//simply builds the thread that gets displayed to the front end
function buildComment(comments, total){
     var thread= []

  for (var x = 0; x < total; x++){
      var date = new Date(comments[x].created_at);
      thread.push({comment:comments[x].plain_body.replace('&gt;', ''),public:comments[x].public,date:date} )
  }
     return thread
}
//cycles through users on a case to find agent
function findAgent(users){
      var agent
      for(x = 0; x < users.length; x++){
          if(users[x].id == currentAssignee){
            agent = users[x]
          }

      }

      return agent
}

//is called by doit function to display data for agent and case
 function showTime2(data,user){
   $('html, body').animate({
      scrollTop: $("#output2").offset().top
  }, 1000);
   var caseInfo ={ comment: data,
                    agent: user.agent,
                    email: user.email,
                    case: currentCaseID
                   }
   var source = $('#part2').html()
   var template = Handlebars.compile(source)
   var html = template(caseInfo)

   $('#output2').html(html);
   callStaff()
 }


//rotate gifs make self calling function
callGiphy()
function callGiphy(){


if($("#thanks").length){
   console.log("thank you page")
   setTimeout(function () {
      window.location.href = "/";
   }, 10000);
   $.ajax({
        type: 'POST',
        url: '/giphyThanks',
        success: showTimeThanks,
        error: errorHandler,
        dataType: 'json'
      });
}
else{
  return
}


}

function showTimeThanks(data){
     var thankInfo = {
       url:data.data.image_url
     }

    var source = $('#randomThanks').html()
    var template = Handlebars.compile(source)
    var html = template(thankInfo)

    $('#gif').html(html)

  }



function callStaff(){
  $.ajax({
    type: 'POST',
    url: '/staffDb',
    success: setStaff,
    error: errorHandler,
    dataType:'json'
  });

}

function setStaff(data){
  var staff = data;
  for (x = 0; x < staff.length; x++){
    $('#drop').append($('<option>', {
        value: staff[x].FirstName+" "+staff[x].LastName+" "+staff[x].Email,
        text:staff[x].FirstName+" "+staff[x].LastName
    }));
  }
  //runs same tiem as get staff

    
   $('input[name=eraser]').change(function(){
     console.log($(this).val())
     if($(this).val() == "Yes"){
        $('.answerYes').removeClass('hide')
        $('.answerNo').addClass('hide')

     }
     else{
       $('.answerNo').removeClass('hide')
       $('.answerYes').addClass('hide')

     }
   })

  //  $yes.on('click', function(){
  //    console.log($('this').checked)
  //  })
   //
  //  $no.on('click', function(){
   //
  //  })

}


//dynamic questions




})






// //working
// https://sharpspring.zendesk.com/api/v2/search.json?query=type:ticket+created%3C2017-02-15+created%3E2017-02-13+status%3E=closed
//
// https://sharpspring.zendesk.com/api/v2/search.json?query=type:ticket+created%3C2017-02-15+created%3E2017-02-13+status%3E=closed
