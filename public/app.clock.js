var stopped;
var form = document.forms[0];
var clocks = document.querySelectorAll('.clock');
var clock_one = document.querySelector(".clock_one");
var clock_two = document.querySelector(".clock_two");
var modal = document.querySelector("dialog");
var toggle_play = document.getElementById("toggle");
var time_control_btn = document.getElementById("time");
var reset_btn = document.getElementById("reset");
var timeout_audio_played = !1;
var timeout_audio = new Audio("./audio/no_time.mp3");
var rotate_animation = [{ transform: "rotate(0)" }, { transform: "rotate(-360deg)" }];

var play_btn = document.getElementById("play-button");
var select = document.getElementById("timecontrol");

var minutes = 3;
var seconds = 0;
var increment = 0;

var timeControl = (minutes * 60) + seconds;
const timer_1 = new Timer();
const timer_2 = new Timer();

var FLAGGED = false;
var OPPONENT_FLAGGED = false;

window.oncontextmenu = () => {
   return false;
};

function zeroPad(num, places) {
   return String(num).padStart(places, '0');
}

function timeString(s) {
 if (s < 60) {
    return s.toString().padStart(2, '0');
 } else {
    var date = new Date(0);
    date.setSeconds(s);
    return date.toISOString().substring(11).replace(/^0+/, '').replace(/^:/, '').slice(0, -5).replace(/^0+/, '').replace(/^:/, '');
 }
}

function reset(clock, timer) {
   has_reached_zero = false
   clock.classList.add("start")
   clock.classList.remove("zero")
   clock.disabled = false
   clock.innerText = timeString(timeControl)
   timeout_audio_played = !1
   //toggle_play.innerText = "K"
   timer.isRunning && timer.stop()
   timer.reset()
   try {
      disabled_clock.disabled = !1
   } catch {
      //the clock was not paused
   }
}

function getTimeControl() {
  let timeRequest;
  var selectTime = select.options[select.selectedIndex].value
  let mins = parseFloat(selectTime)
  let incr = parseInt(selectTime.slice(selectTime.indexOf("+")))
  let secs = mins*60 - Math.floor(mins)*60
  let time = mins*60+secs

  timeRequest = {timeControl: time, increment: incr}
  return timeRequest;
}



function clockChange() {
  if (timer_1.isRunning) {
    timer_1.stop();
    timer_2.start();
    timer_1.subtractTime(increment*1000);
  }
  else {
    timer_2.stop();
    timer_1.start();
    timer_2.subtractTime(increment*1000)
  }
  

}


//time_control_btn.addEventListener("click", () => {
//   modal.showModal()
//})

var has_reached_zero = false

var interval;

function update(timer, clock) {
   var time = timeControl - Math.round(timer.getTime() / 1000)
   if (!timeout_audio_played && time <= .4) {
      timeout_audio.play()
      timeout_audio_played = true
   }

   if (time <= 0) {
      clearInterval(interval);
      timer.stop();
      if (!has_reached_zero){
         has_reached_zero = true
         clock.classList.add("zero")
         clock.innerText = "0"
         timer.isRunning && timer.stop()
      } else {
         timer.isRunning && timer.stop()
      }
      if (clock.classList.contains('clock_one')) {
        OPPONENT_FLAGGED = true;
        updateStatus();
      }
      else {
        FLAGGED = true;
        updateStatus();
      }
   } else {
      clock.innerText = timeString(time)
   }
}

function is_pauseable() {
   return !clock_one.classList.contains("zero")
   && !clock_two.classList.contains("zero")
   && (!clock_two.classList.contains('start')
   || !clock_one.classList.contains('start'))
}

var disabled_clock;
function pause(){
   if (is_pauseable()) {
      if (toggle_play.innerText === "K") {
         toggle_play.innerText = "J"
         if (timer_1.isRunning) {
            stopped = timer_1
            timer_1.stop()
            disabled_clock = clock_one
            clock_one.disabled = !0
         } if (timer_2.isRunning) {
            stopped = timer_2
            timer_2.stop()
            disabled_clock = clock_two
            clock_two.disabled = !0
         }
      } else {
         toggle_play.innerText = "K"
         try {
            disabled_clock.disabled = !1, stopped.start()
         } catch (error){
            //Error unpausing clock
            console.error(error)
            reset(clock_one, timer_1)
            reset(clock_two, timer_2)
         }
      }
   }
}

toggle_play.addEventListener("click", function () {
   pause()
})
window.addEventListener("keydown", (e) => {
   if (e.key == " "){
      pause()
   }
})
reset_btn.addEventListener("click", () => {
   if (!clock_one.classList.contains("start")) {
   reset_btn.animate(rotate_animation, 800)
   reset(clock_one, timer_1)
   reset(clock_two, timer_2)
   }
})
