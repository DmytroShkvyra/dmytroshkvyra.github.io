function UserMedia(){
    var _getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
	    navigator.mozGetUserMedia || navigator.msGetUserMedia;
    function getUserMedia(kindofmedia, inout, success, error, sourceId){
	req = {};
	if (kindofmedia === 'audio') { 
	  req['audio'] = true;
	  req['video'] = false;
	} else if (kindofmedia === 'video') {
	  req['video'] = true;
	  req['audio'] = false;
	  if (navigator.mediaDevices !== undefined && navigator.mediaDevices.getUserMedia !== undefined){
	    req['video'] = {};
	    req['video']['facingMode'] = "environment";
          }
	}
	if (sourceId !== undefined) {
	  req['sourceId'] = sourceId;  
	} else if (this.devices !== undefined){
	  var type = kindofmedia+inout;
	  for (var i = 0; i < this.devices.length; i++) {
	     if (devices[i].kind === type) {
		req['sourceId'] = devices[i].sourceId;
		break;
	     } 
	  }  
	}
	this._getUserMedia(req, success, error);
    };
    var devices = undefined;
    var _audioContext = window.AudioContext || window.webkitAudioContext;
    var context = undefined;
    function getAudioContext(){
	if(this.context === undefined){
	    this.context = new this._audioContext();
	}    
	return this.context;
    };
    var onSuccessDevices = function(devs){
	this.devices = devs;
    };
    var onErrorDevices = function(e){
	if (navigator.MediaStreamTrack !== undefined && navigator.MediaStreamTrack.getSources !== undefined){
	   try{
	     navigator.MediaStreamTrack.getSources(onSuccessDevices);  
	 } catch(err){
	     alert("This browser doesn't support work with media devices. Errors:\n"+e+"\n"+err);
	 } 
	}
    };
    if(this.getUserMedia === undefined && navigator.mediaDevices !== undefined){
	this.getUserMedia = navigator.mediaDevices.getUserMedia;
    }
    if (navigator.mediaDevices !== undefined && navigator.mediaDevices.enumerateDevices !== undefined){
	navigator.mediaDevices.enumerateDevices()
	    .then(onSuccessDevices).catch(onErrorDevices);	
    }
}

var userMedia = new UserMedia();
userMedia.getUserMedia('audio', 'input', success, alert, null);

//if (navigator.getUserMedia === undefined) {
//    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
//	    navigator.mozGetUserMedia || navigator.msGetUserMedia;
//    if(navigator.getUserMedia === undefined){
//	navigator.getUserMedia = navigator.mediaDevices;
//    }
//}
//
//if (navigator.mediaDevices !== undefined && navigator.mediaDevices.enumerateDevices !== undefined) {
//    navigator.mediaDevices.enumerateDevices()
//	    .then(gotDevices)
//	    .catch(function(err) {
//		alert(err.name + ": " + err.message);
//	    });
//} else if (navigator.MediaStreamTrack !== undefined && navigator.MediaStreamTrack.getSources !== undefined) {
//    navigator.MediaStreamTrack.getSources(gotDevices);
//} else {
//    alert("This browser doesn't support work with media devices");
//}
//
//var breakLoop = false;
//// List cameras and microphones.
//function gotDevices(devices) {
//    for (var i = 0; i < devices.length; i++) {
//	if (breakLoop)
//	    break;
//	if (devices[i].kind === 'audioinput') {
//	    if (navigator.getUserMedia) {
//		navigator.getUserMedia({audio: true, sourceId: devices[i].deviceId
////		    {
////			optional: [{
////				sourceId: devices[i].deviceId
////			    }]
////		    }
//		}, success, function(e) {
//		    alert('Error capturing audio.' + e.name);
//		});
//	    } else
//		alert('getUserMedia not supported in this browser.');
//	}
//    }
//}



function success(e) {
    //breakLoop = true; //break loop of trying audiosources
    //audioContext = window.AudioContext || window.webkitAudioContext;
    //context = new audioContext();
    //alert(context.sampleRate);
    context = userMedia.getAudioContext();
    volume = context.createGain();
    audioInput = context.createMediaStreamSource(e);
    audioInput.connect(volume);
    var bufferSize = 512;
    recorder = context.createScriptProcessor(bufferSize, 1, 1);
    var outputElement = document.querySelector('#output');
    var dtmf = new DTMF({
	sampleRate: context.sampleRate,
	peakFilterSensitivity: 0.2,
	repeatMin: 4,
	downsampleRate: 1,
	threshold: 0.005
    });
    dtmf.on("decode", function(value) {
	if (value !== null) {
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