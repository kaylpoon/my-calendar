var countDownDate = new Date("Jan 1, 2026 00:00:00").getTime();

// Update the count down every 1 second
var x = setInterval(function() {

  // Get today's date and time
  var now = new Date().getTime();

  // Find the distance between now and the countdown date
  var distance = countDownDate - now;
  
  // Calculate time units and display the result
  // If the count down is finished, display "EXPIRED" and stop the timer
  if (distance < 0) {
    clearInterval(x);
    document.getElementById("countdown").innerHTML = "EXPIRED";
  } else {
    // Placeholder for calculating and displaying time units
    // Detailed calculations and display logic can be found in the linked resources.
  }
}, 1000); // Update every 1 second
