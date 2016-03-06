


var userMedia = new UserMedia();
userMedia.getUserMedia('audio', 'input', success, alert, undefined);

function success(e) {
    context = userMedia.getAudioContext();
    volume = context.createGain();
    audioInput = context.createMediaStreamSource(e);
    audioInput.connect(volume);
    var bufferSize = 1024;
    recorder = context.createScriptProcessor(bufferSize, 1, 1);
    var outputElement = document.querySelector('#output');
    var dtmf = new DTMF({
	sampleRate: context.sampleRate,
	peakFilterSensitivity: 1.4,
	repeatMin: 7,
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