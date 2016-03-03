if (navigator.getUserMedia === undefined) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
	    navigator.mozGetUserMedia || navigator.msGetUserMedia;
}

var audiosources = [];

if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    alert("enumerateDevices() not supported.");
}

var breakLoop = false;
// List cameras and microphones.
function gotDevices(devices) {
    for (var i = 0; i < devices.length; i++) {
	if (breakLoop) break;
	if (devices[i].kind == 'audioinput') {
	    audiosources.push(devices[i].deviceId);
	    if (navigator.getUserMedia) {
		navigator.getUserMedia({audio: true, sourceId: devices[i].deviceId
//		    {
//			optional: [{
//				sourceId: devices[i].deviceId
//			    }]
//		    }
		}, success, function(e) {
		    alert('Error capturing audio.'+e.name);
		});
	    } else
		alert('getUserMedia not supported in this browser.');
	}
    }
}

navigator.mediaDevices.enumerateDevices()
	.then(gotDevices)
	.catch(function(err) {
	    alert(err.name + ": " + err.message);
	});



function success(e) {
    breakLoop = true; //break loop of trying audiosources
    audioContext = window.AudioContext || window.webkitAudioContext;
    context = new audioContext();
    volume = context.createGain();
    audioInput = context.createMediaStreamSource(e);
    audioInput.connect(volume);
    var bufferSize = 512;
    recorder = context.createScriptProcessor(bufferSize, 1, 1);
    var outputElement = document.querySelector('#output');
    var dtmf = new DTMF({
	sampleRate: context.sampleRate,
	peakFilterSensitivity: 1.4,
	repeatMin: 6,
	downsampleRate: 1,
	threshold: 0.005
    });
    dtmf.on("decode", function(value) {
	if (value != null) {
	    outputElement.innerHTML = outputElement.innerHTML + value;
	}
    });
    recorder.onaudioprocess = function(e) {
	var buffer = e.inputBuffer.getChannelData(0);
	dtmf.processBuffer(buffer);
    };
    volume.connect(recorder);
    recorder.connect(context.destination);
}