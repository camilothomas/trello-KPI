/* code required to populate x axis dates of chart and
   provide data for two lines on chart.  The data is
   fetched using axios from an aws lambda endpoint
   the lambda endpoint fetches data from a Trello api
*/
// show_days variable can be changed to affect time period of chart
// (29 is appropriate for a 30 day period)
const show_days = 29;

/******************** x_axis_dates() ************************
 * receives days arg for amount of days returns an array of *
 * (days arg + 1) date strings formatted for chart x axis   *
 ************************************************************/
function x_axis_dates(days) {
  var d = moment();
  var xaxis = [];
  var change_days = days;
  d.subtract(change_days, 'days');
  for(let x = 0; x <= days; x++) {
    xaxis.push((d.month() + 1) + "/" + d.date());
	d.add(1, 'days');	 
  }
  return(xaxis);
}
/******************** moment_dates() ***********************
 * same as x_axis dates: receives days arg for amt of days *
 * returns an array of (days arg + 1) date strings.  These *
 * date strings are used to make moment objects in the     *
 * two_lines function()                                    *
 ***********************************************************/
function moment_dates(days) {
  var md = moment();
  var mdates = [];
  var change_days = days;
  md.subtract(change_days, 'days');
  for(let x = 0; x <= days; x++) {
  	mdates.push(md.format());
  	md.add(1, 'days');
  }
  return(mdates);
}
/***************** line_operations() ************************
 * both lines require almost identical operations this      *
 * function receives raw enpoint data (created or resolved) *
 * returns chart data so that the operations don't need to  *
 * be performed twice in the two_lines() function           *
 ************************************************************/
function line_operations(a_line) {
  // for loop to change Trello ISO dates to moment objects
  // that work with moment methods 
  for(let x = 0; x < a_line.length; x++) {
    a_line[x].cDate = moment(a_line[x].cDate);
  }
  // call function that returns array of moment.format() strings of
  // last (show_days + 1) days
  var chart_days = moment_dates(show_days);
  // convert moment.format() strings to moment objects
  for(let x = 0; x < chart_days.length; x++) {
    chart_days[x] = moment(chart_days[x]);
  }
  // create an array of 60 zeros
  var zero_array = new Array(show_days + 1).fill(0);
  // compare created/resolved dates to dates on chart x axis
  // and count them to zero_array
  for(let x = 0; x < chart_days.length; x++) {
    for(let abc = 0; abc < a_line.length; abc++) {
      if (chart_days[x].date() == a_line[abc].cDate.date()) {
        if (chart_days[x].month() == a_line[abc].cDate.month()) {
          if (chart_days[x].year() == a_line[abc].cDate.year()) {
            zero_array[x]++;
          } // end if
        } // end if
      } // end if
    }  //end for
  } //end for
  // make the created dates accumulate
  for(let x = 0; x < zero_array.length - 1; x++) {
    zero_array[x+1] = zero_array[x+1] + zero_array[x];
  }
  return(zero_array);
}
/********************** two_lines() ************************
 * returns an array of two arrays.  [0] is the chart data  *
 * for the created line and [1] is the chart data for the  *
 * resolved line                                           *
 ***********************************************************/
async function two_lines() {
  // calling our lambda function
  try {
    var cr_call = await axios.get('https://7ixzzzszw1.execute-api.us-east-1.amazonaws.com/dev/chartdb');
  }
  catch(err) {}
    var myChart = new Chart(ctx, {
      options: {
        title: {
          display: true,
          text: "The data could not be fetched; Try again later",
          fontFamily: 'Lucida Console',
          fontColor: 'red',
          fontSize: 25
        }
      }
    });
  // get created & resolved data into variables
  var created = cr_call.data.created;  
  var resolved = cr_call.data.resolved;
  // call line_operations function for both sets of data
  var zero_array1 = line_operations(created);
  var zero_array2 = line_operations(resolved);
  // output data for two lines
  var ret_array = [zero_array1, zero_array2];
  return(ret_array);
};
const promise = two_lines();