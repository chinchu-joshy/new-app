function imageChange(event){
    document.getElementById('imageId').src=URL.createObjectURL(event.target.files[0])
}
function readURL(input) {
  if (input.files && input.files[0]) {
      var reader = new FileReader();

      reader.onload = function (e) {
          $('#blah')
              .attr('src', e.target.result)
              .width(150)
              .height(200);
      };

      reader.readAsDataURL(input.files[0]);
  }
}

function enablefield(){
   
  document.getElementById("myfield").disabled = false;


}
 
  var dates=document.getElementsById("date").innerHTML
  var value=document.getElementById("present").innerHTML
 
 
    let events=[ {
     Date:new Date(dates),
      Value:new Date(value)
    }
]
 
     $(function() {
      $("#calendario").datepicker({
        dateFormat: "dd/mm/yy",
        dayNames: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          
        ],
        dayNamesMin: ["S", "M", "T", "W", "T", "F", "S"],
        dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Tu", "Fri", "Sat"],
        monthNames: [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December"
        ],
        monthNamesShort: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec"
        ],
        nextText: "Próximo",
        prevText: "Anterior",
        beforeShowDay: function(date) {
          var result = [true, "", null];
         
          var matching = $.grep(events, function(event) {
            return event.Date.valueOf() === date.valueOf();
          });
          if (matching.length) {
            result = [true, "highlight", matching[0].Title];
          }
  
          var matchings = $.grep(events, function(event) {
            return event.Value.valueOf() === date.valueOf();
          });
          if (matchings.length) {
            result = [true, "highlights", matchings[0].Title];
          }
  
  
          return result;
        }
      });
    });
  
 
  
 
  
  
 // $("#mybtn").click(function() {
    //$("#mybtn").attr("disabled", true);
   // $.ajax({
       // url: 'http://localhost:3000/student-entry/student-entry',
        //data: { 
           // action: 'viewRekonInfo'
        //},
        //type: 'post',
        //success: function(response){
            //success process here
            //$("#alertContainer").delay(1000).fadeOut(800);

            //$("#mybtn").attr("disabled", false);
        //},
        //error: errorhandler,
        //dataType: 'json'
    //});
//});
// function showbtn(){
   // $.ajax({
        //url:'/student-entry',
        
        //method:'post',
        //success:(response)=>{
          //alert(response)
           //if(response.status){
            //document.getElementById("mybtn").disabled = false;
            //location.href='/student-entry'
             
           //}
        //}
     // })
 //}
 //$("#checkout-form").submit((e)=>{
    //e.preventDefault()
    //$.ajax({
      //url:"/student-entry",
      //method:'post',
      //data:$("#checkout-form").serialize(),
      //success:(response)=>{
        //alert(response)
        //if(response.status){
            //document.getElementById("mybtn").disabled = false;
          //location.href='/student-entry'
        //}
      //}
    //})
  //})