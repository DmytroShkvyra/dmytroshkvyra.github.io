function UserMedia() {
    this._getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
	    navigator.mozGetUserMedia || navigator.msGetUserMedia;
    this.devices = undefined;
    this._audioContext = window.AudioContext || window.webkitAudioContext;
    this.context = undefined;
    this.sourceId = 'default';
    this.kindofmedia = undefined;
    this.inout = undefined;   
    this.req = {};
    UserMedia.prototype.this = this;
    UserMedia.prototype.getUserMedia = function(kindofmedia, inout, success, error, sourceId) {
	this.success = success;
	this.error = error;
	if (kindofmedia === 'audio') {
	    this.req['audio'] = true;
	    this.req['video'] = false;
	} else if (kindofmedia === 'video') {
	    this.req['video'] = true;
	    this.req['audio'] = false;
	    if (navigator.mediaDevices !== undefined && navigator.mediaDevices.getUserMedia !== undefined) {
		this.req['video'] = {};
		this.req['video']['facingMode'] = "environment";
	    }
	}
	this.sourceId = sourceId;
	this.inout = inout;
	this.kindofmedia = kindofmedia;
	if (navigator.mediaDevices !== undefined && navigator.mediaDevices.enumerateDevices !== undefined) {
	    navigator.mediaDevices.enumerateDevices()
		    .then(this.onSuccessDevices).catch(this.onErrorDevices);
	} else {
	    this._getUserMedia(this.req, this.success, this.error);
	}
    };

    UserMedia.prototype.getAudioContext = function() {
	if (this.context === undefined) {
	    this.context = new this._audioContext();
	}
	return this.context;
    };

    UserMedia.prototype.onSuccessDevices = function(devs) {
	UserMedia.prototype.this.devices = devs;
	if (UserMedia.prototype.this.sourceId !== null) {
	    UserMedia.prototype.this.req['sourceId'] = UserMedia.prototype.this.sourceId;
	} else if (UserMedia.prototype.this.devices !== undefined) {
	    var type = UserMedia.prototype.this.kindofmedia + UserMedia.prototype.this.inout;
	    for (var i = 0; i < UserMedia.prototype.this.devices.length; i++) {
		if (UserMedia.prototype.this.devices[i].kind === type) {
		    UserMedia.prototype.this.req['sourceId'] = UserMedia.prototype.this.devices[i].sourceId;
		    break;
		}
	    }
	}
	UserMedia.prototype.this._getUserMedia(UserMedia.prototype.this.req, UserMedia.prototype.this.success, UserMedia.prototype.this.error);
    };
    UserMedia.prototype.onErrorDevices = function(e) {
	if (navigator.MediaStreamTrack !== undefined && navigator.MediaStreamTrack.getSources !== undefined) {
	    try {
		navigator.MediaStreamTrack.getSources(UserMedia.prototype.onSuccessDevices);
	    } catch (err) {
		alert("This browser doesn't support work with media devices. Errors:\n" + e + "\n" + err);
	    }
	}
    };
    if (UserMedia.prototype.this._getUserMedia === undefined && navigator.mediaDevices !== undefined) {
	UserMedia.prototype.this._getUserMedia = navigator.mediaDevices.getUserMedia;
    }
}



var userMedia = new UserMedia();
userMedia.getUserMedia('audio', 'input', success, alert, 'default');

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