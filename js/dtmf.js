// Generated by CoffeeScript 1.9.3
var DTMF;

DTMF = (function() {
    function DTMF(options) {
	var key;
	if (options == null) {
	    options = {};
	}
	this.peakFilterSensitivity = options.peakFilterSensitivity;
	this.downsampleRate = options.downsampleRate || 1;
	this.sampleRate = options.sampleRate / this.downsampleRate;
	this.frequencyTable = {
	    697: {
		1209: '1',
		1336: '2',
		1477: '3',
		1633: 'A'
	    },
	    770: {
		1209: '4',
		1336: '5',
		1477: '6',
		1633: 'B'
	    },
	    852: {
		1209: '7',
		1336: '8',
		1477: '9',
		1633: 'C'
	    },
	    941: {
		1209: '*',
		1336: '0',
		1477: '#',
		1633: 'D'
	    }
	};
	this.lowFrequencies = [];
	for (key in this.frequencyTable) {
	    this.lowFrequencies.push(parseInt(key));
	}
	this.highFrequencies = [];
	for (key in this.frequencyTable[this.lowFrequencies[0]]) {
	    this.highFrequencies.push(parseInt(key));
	}
	this.allFrequencies = this.lowFrequencies.concat(this.highFrequencies);
	this.threshold = options.threshold || 0;
	this.repeatCounter = 0;
	this.firstPreviousValue = '';
	this.goertzel = new Goertzel({
	    frequencies: this.allFrequencies,
	    sampleRate: this.sampleRate,
	    threshold: this.threshold
	});
	this.repeatMin = options.repeatMin;
	this.decodeHandlers = [];
    }

    DTMF.prototype.energyProfileToCharacter = function(register) {
	var energies, f, highFrequency, highFrequencyEngergy, j, k, len, len1, lowFrequency, lowFrequencyEnergy, ref, ref1;
	energies = register.energies;
	highFrequency = 0.0;
	highFrequencyEngergy = 0.0;
	ref = this.highFrequencies;
	for (j = 0, len = ref.length; j < len; j++) {
	    f = ref[j];
	    if (energies[f] > highFrequencyEngergy && energies[f] > this.threshold) {
		highFrequencyEngergy = energies[f];
		highFrequency = f;
	    }
	}
	lowFrequency = 0.0;
	lowFrequencyEnergy = 0.0;
	ref1 = this.lowFrequencies;
	for (k = 0, len1 = ref1.length; k < len1; k++) {
	    f = ref1[k];
	    if (energies[f] > lowFrequencyEnergy && energies[f] > this.threshold) {
		lowFrequencyEnergy = energies[f];
		lowFrequency = f;
	    }
	}
	if (this.frequencyTable[lowFrequency] !== void 0) {
	    return this.frequencyTable[lowFrequency][highFrequency] || null;
	}
    };

    DTMF.prototype.processBuffer = function(buffer) {
	var badPeaks, f, freq, handler, highEnergies, i, j, len, lowEnergies, ref, result, value;
	value = '';
	highEnergies = [];
	lowEnergies = [];
	result = [];
	Goertzel.Utilities.eachDownsample(buffer, this.downsampleRate, (function(_this) {
	    return function(sample, i, downSampledBufferLength) {
		var windowedSample;
		windowedSample = Goertzel.Utilities.exactBlackman(sample, i, downSampledBufferLength);
		_this.goertzel.processSample(windowedSample);
		return value = _this.energyProfileToCharacter(_this.goertzel);
	    };
	})(this));
//--------------------------------------------
{
	var dtmf_sym = 
JSON.parse('{"1":[697,1209],"2":[697,1336],"3":[697,1477],"A":[697,1633],\n\
             "4":[770,1209],"5":[770,1336],"6":[770,1477],"B":[770,1633],\n\
	     "7":[852,1209],"8":[852,1336],"9":[852,1477],"C":[852,1633],\n\
	     "*":[941,1209],"0":[941,1336],"#":[941,1477],"D":[941,1633]\n\
             }');
	var symbolsEnergy = {};
	var avgEnergy = 0;
	var sym_lengt = 0;
	for (var key in dtmf_sym) {
	    sym_lengt++;
	    frqArr = dtmf_sym[key];
	    var energy = 1.0;
	    for(var i=0; i<frqArr.length; i++){
		energy *= Math.sqrt(this.goertzel.energies[frqArr[i]]);
	    }
	    symbolsEnergy[key] = energy;
	    avgEnergy += energy;
	}
	avgEnergy /= sym_lengt;
	var sigma = 0.0;
	for (var key in symbolsEnergy) {
	   sigma += Math.pow((symbolsEnergy[key] - avgEnergy), 2); 
	}
	sigma = Math.sqrt(sigma /= (sym_lengt-1));
	var sigma3 = sigma*3.5;
	var clearSymbols = {};
	sym_lengt = 0;
	for (var key in symbolsEnergy) {
	    if(symbolsEnergy[key] > (sigma3 + avgEnergy)){
		clearSymbols[key]= symbolsEnergy[key];
		sym_lengt++;
	    }
	}
	if (sym_lengt > 0){ 
	   console.log("sym_lengt =" + sym_lengt + "\nsigma3="+sigma3 + "\navgEnergy="+avgEnergy);
	}
}	
//--------------------------------------------------	
	i = 0;
	highEnergies = [];
	while (i < this.highFrequencies.length) {
	    f = this.highFrequencies[i];
	    highEnergies.push(this.goertzel.energies[f]);
	    i++;
	}
	lowEnergies = [];
	while (i < this.lowFrequencies.length) {
	    freq = this.lowFrequencies[i];
	    lowEnergies.push(this.goertzel.energies[freq]);
	    i++;
	}
	badPeaks = Goertzel.Utilities.doublePeakFilter(highEnergies, lowEnergies, this.peakFilterSensitivity);
	if (badPeaks === false) {
	    if (value === this.firstPreviousValue && value !== void 0) {
		this.repeatCounter += 1;
		if (this.repeatCounter === this.repeatMin) {
		    result.push(value);
		    ref = this.decodeHandlers;
		    console.log(this.firstPreviousValue);
		    for (j = 0, len = ref.length; j < len; j++) {
			handler = ref[j];
			setTimeout(handler(value), 0);
		    }
		}
	    } else {
		this.repeatCounter = 0;
		this.firstPreviousValue = value;
	    }
	}
	this.goertzel.refresh();
	return result;
    };

    DTMF.prototype.on = function(eventName, handler) {
	switch (eventName) {
	    case "decode":
		return this.decodeHandlers.push(handler);
	}
    };

    return DTMF;

})();

if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
    module.exports = DTMF;
}