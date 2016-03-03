/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
      var contextClass = (window.AudioContext ||
        window.webkitAudioContext ||
        window.mozAudioContext ||
        window.oAudioContext ||
        window.msAudioContext);

      if (contextClass) {
        // Web Audio API is available.
        var context = new contextClass();
      }

      var oscillator1, oscillator2;

      function dialTone(freq1, freq2){

        // merger = context.createChannelMerger(2);

        oscillator1 = context.createOscillator();
        oscillator1.type = "sine";
        oscillator1.frequency.value = freq1;
        gainNode = context.createGain ? context.createGain() : context.createGainNode();
        oscillator1.connect(gainNode,0,0);
        gainNode.connect(context.destination);
        gainNode.gain.value = .1;
        oscillator1.start ? oscillator1.start(0) : oscillator1.noteOn(0);

        // gainNode.connect(merger,0,1);

        oscillator2 = context.createOscillator();
        oscillator2.type = "sine";
        oscillator2.frequency.value = freq2;
        gainNode = context.createGain ? context.createGain() : context.createGainNode();
        oscillator2.connect(gainNode);
        gainNode.connect(context.destination);
        // gainNode.connect(merger,0,0);


        gainNode.gain.value = .1;
        oscillator2.start ? oscillator2.start(0) : oscillator2.noteOn(0);

        // merger.connect(context.destination);


      };

function playDialtone(freq1, freq2, duration) {
      dialTone(freq1, freq2);
      var timerId = setTimeout(function() { stop();  clearTimeout(timerId);}, duration);     
}
    
function playDialtoneString(dial_str, duration, tone_pause) {
        var str = dial_str.toUpperCase();
	var toneDuration = (typeof duration === 'undefined') ? 100 : duration;
	var pause = (typeof tone_pause === 'undefined') ? 20 : tone_pause;
	var i = 0;
	var dtmf_table = 
JSON.parse('{"1":[697,1209],"2":[697,1336],"3":[697,1477],"A":[697,1633],\n\
             "4":[770,1209],"5":[770,1336],"6":[770,1477],"B":[770,1633],\n\
	     "7":[852,1209],"8":[852,1336],"9":[852,1477],"C":[852,1633],\n\
	     "*":[941,1209],"0":[941,1336],"#":[941,1477],"D":[941,1633]\n\
             }');    
	var timerId = setTimeout(function run() {
	    if (str.length === i) {
		clearTimeout(timerId);
		return;
	    }
	    playDialtone(dtmf_table[str[i]][0], dtmf_table[str[i]][1], toneDuration);
	    timerId = setTimeout(run, toneDuration + pause, [dtmf_table[str[i]][0], dtmf_table[str[i]][1]]);
	    i++;
	}, toneDuration + pause, [dtmf_table[str[i]][0], dtmf_table[str[i]][1]]);
    }


    function stop() {
	if (typeof oscillator1 !== 'undefined')
	    oscillator1.disconnect();
	if (typeof oscillator2 !== 'undefined')
	    oscillator2.disconnect();
    }


