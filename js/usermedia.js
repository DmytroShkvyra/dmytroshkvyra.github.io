function UserMedia() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
	    navigator.mozGetUserMedia || navigator.msGetUserMedia;
    this.devices = undefined;
    this._audioContext = window.AudioContext || window.webkitAudioContext;
    this.context = undefined;
    this.deviceId = 'default';
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
	this.deviceId = sourceId;
	this.inout = inout;
	this.kindofmedia = kindofmedia;
	if (navigator.mediaDevices !== undefined && navigator.mediaDevices.enumerateDevices !== undefined) {
	    navigator.mediaDevices.enumerateDevices()
		    .then(this.onSuccessDevices).catch(this.onErrorDevices);
	} else {
	    navigator.getUserMedia(this.req, this.success, this.error);
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
	if (UserMedia.prototype.this.deviceId !== undefined) {
	    UserMedia.prototype.this.req['sourceId'] = UserMedia.prototype.this.deviceId;
	} else if (UserMedia.prototype.this.devices !== undefined) {
	    var type = UserMedia.prototype.this.kindofmedia + UserMedia.prototype.this.inout;
	    for (var i = 0; i < UserMedia.prototype.this.devices.length; i++) {
		if (UserMedia.prototype.this.devices[i].kind === type) {
		    UserMedia.prototype.this.req.deviceId = UserMedia.prototype.this.devices[i].deviceId;
		    break;
		}
	    }
	}
	navigator.getUserMedia(UserMedia.prototype.this.req, UserMedia.prototype.this.success, UserMedia.prototype.this.error);
    };
    UserMedia.prototype.onErrorDevices = function(e) {
	var  err1;
	if (navigator.MediaStreamTrack !== undefined && navigator.MediaStreamTrack.getSources !== undefined) {
	    try {
		navigator.MediaStreamTrack.getSources(UserMedia.prototype.onSuccessDevices);
	    } catch (err) {
		err1 = err;
	    } finally {
		alert("This browser doesn't support work with media devices. Errors:\n" + e + "\n" + err1);
	    }
	}
	alert("This browser doesn't support work with media devices. Errors:\n" + e);
    };
    if (navigator.getUserMedia === undefined && navigator.mediaDevices !== undefined) {
	navigator.getUserMedia = navigator.mediaDevices.getUserMedia;
    }
}
