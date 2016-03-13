function walsh(n, shift, step){
  walsh.prototype.this = this;
  this.n = (n !== undefined)? n: 32;
  this.shift = (shift !== undefined)? shift: 45;
  this.step = (step !== undefined)? step: 3;
  
  walsh.prototype.getWave = function(code){
    var codeArr = this.matrix[code];
    var lengthOfFFT = this.shift + 1 + codeArr.length*this.step*2;
    var res = new Array(lengthOfFFT).fill(0,0,lengthOfFFT);
    var walshKoefs = new Array(this.shift + 1 + codeArr.length*this.step).fill(0,0,this.shift + 1 + codeArr.length*this.step);
    for(var i= 0; i<codeArr.length; i++){
      var val = 0;
      if (codeArr[i] === 1) {
		res[this.shift + 1 + this.step*i*2] = 1
      }
      else if (codeArr[i] === -1) {
		res[this.shift + 1 + this.step*i*2+this.step] = 1
	 }
      walshKoefs[this.shift + 1 + this.step*i] = codeArr[i];
    }
    this.spectrWalsh[code] = walshKoefs;
    return new Float32Array(res);
  };
  
  walsh.prototype.negativate = function(matrix){
    res = this.create2DArr(matrix.length);
    for(var n=0; n<matrix.length; n++){
      for (var m=0; m<matrix[n].length; m++){
        res[n][m] = matrix[n][m]*-1;
      }
    }
    return res;  
  };
  
  walsh.prototype.create2DArr = function(n){
    var res = [];
    for(var i=0; i<n; i++){
      res.push([]);
      for(var j=0; j<n; j++){
        res[i].push(0);
      }
    }
    return res;
  };
  
  walsh.prototype.createAdamar = function(matrix){
    var dimension = matrix.length;
    var newDimesion = dimension*2;
    var resMatrix = this.create2DArr(newDimesion);
    for(var N=0; N<2; N++){
      for(var M=0; M<2; M++){
        var tmpMatrix = matrix;
        if(N>0 && M>0) {
          tmpMatrix = this.negativate(matrix);
        }
        for(var n=0; n<dimension; n++){
          for(var m=0; m<dimension; m++){
            resMatrix[N*dimension+n][M*dimension+m] = tmpMatrix[n][m];
          }
        }
      }
    }
    return (resMatrix.length<this.n)? this.createAdamar(resMatrix): resMatrix;
  };
  
  walsh.prototype.decode = function(inputarr){
    var res = {};
	var mags = new Array(this.matrix.length).fill(0,0,this.matrix.length);
    for(var i=1; i<this.matrix.length; i++){
      var mag = 0;
      for(var j=0; j<this.matrix.length; j++){
        var positive = inputarr[this.shift + 1 + this.step*j*2];
		var negative = inputarr[this.shift + 1 + this.step*j*2+this.step];
        //var positive = inputarr[this.shift + this.step*j*2];
		//var negative = inputarr[this.shift + this.step*j*2+this.step];
		var bit = positive-negative;
		mag += this.matrix[i][j]*bit;
      }
	  mags[i] = (mag >0 )? mag : 0;
    }

	var diff = 0;
	var avg = 0;
	var c = 0;
	for(var j=0; j<mags.length; j++){
		if(mags[j]>0){
			avg += mags[j];
			c++;
		}
    }
	avg /= c; 
	for(var j=0; j<mags.length; j++){
		if(mags[j]>0){
			diff += Math.pow(mags[j]-avg, 2);
		}
    }
	diff /= c;
	this.sigma = Math.sqrt(diff);
	for(var j=1; j<mags.length; j++){
		res[j] = (mags[j]> avg)? (mags[j]-avg)/this.sigma : 0;  
    }
	
    return res;
  };

  this.encodeMatrix = this.create2DArr(this.n -1 );
  for(var i=0; i<this.encodeMatrix.length; i++){
    var c = 1;
	for(var j=0; j<this.encodeMatrix.length; j++){
		if(i==j){
			this.encodeMatrix[j][i] = 0;
		} else {
		    this.encodeMatrix[j][i] = c++;
		} 
	}
  
  }  

  // Encode sequece of sym to prevent repeating
  walsh.prototype.encode = function(outputarr){
	var res = [];
	this.perv = 0;
	for(var i=0; i<outputarr.length; i++){
		var sym = outputarr[i]+1;
        if(sym > this.encodeMatrix.length - 1) throw ("There have not to be value more than " + (this.encodeMatrix.length - 2))
	    if(i==0){
				res.push(sym);
				this.perv = sym;			
		}
		for(var j=0; j<this.encodeMatrix.length; j++){
			if(sym == this.encodeMatrix[j][this.perv]){
				this.perv = j;
				res.push(j);
				break;
			}
		}
	}
    return res;
  }

  walsh.prototype.decodeSequenceTest = function(arr){
	var res = [];
	function addToRes(sym){
		res.push(sym);
	}
	for(var i=0; i<arr.length; i++){
		this.decodeSequence(arr[i], addToRes);
	}
	return res;
  }
  
  walsh.prototype.decodeSequence = function(sym, detected){
    if(this.first === undefined){
		this.first = sym;
		if(this.timerId !== undefined) clearTimeout(this.timerId)
		this.timerId = setTimeout(this.clearSym, 200 );
		return;
	} else if(this.first === sym){
		if(this.timerId !== undefined) clearTimeout(this.timerId)
		this.timerId = setTimeout(this.clearSym, 200 );
		return;
	} else {
        var res;
		try{
			res = this.encodeMatrix[sym][this.first];
		} catch (err) {
			this.first = sym;
			if(this.timerId !== undefined) clearTimeout(this.timerId)
			this.timerId = setTimeout(this.clearSym, 200 );
			return;
		}
		this.first = sym;
		if(this.timerId !== undefined) clearTimeout(this.timerId)
		this.timerId = setTimeout(this.clearSym, 200 );
		if(detected !== undefined) detected(res-1);
	}
  }  

  walsh.prototype.clearSym = function(){
	if(walsh.prototype.this.timerId !== undefined) clearTimeout(walsh.prototype.this.timerId)
	walsh.prototype.this.first = undefined;  
  }
  
  this.matrix = this.createAdamar([[1,1],[1,-1]]);
 
  this.waves = new Array(this.n);
  this.spectrWalsh = new Array(this.n);
  for(var i=0; i<this.waves.length; i++){
    this.waves[i] = this.getWave(i);
  }
  
}