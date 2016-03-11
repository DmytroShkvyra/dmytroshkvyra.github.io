function walsh(n, shift, step){
  walsh.prototype.this = this;
  this.n = (n !== undefined)? n: 64;
  this.shift = (shift !== undefined)? shift: 45;
  this.step = (step !== undefined)? step: 3;
  
  walsh.prototype.getWave = function(code){
    var codeArr = this.matrix[code];
    var lengthOfFFT = this.shift + 1 + codeArr.length*this.step;
    var res = new Array(lengthOfFFT).fill(0,0,lengthOfFFT);
    var walshKoefs = new Array(lengthOfFFT).fill(0,0,lengthOfFFT);
    for(var i= 0; i<codeArr.length; i++){
      var val = 0;
      if (codeArr[i] === 1) val=1;
      else if (codeArr[i] === -1) val=0;
      res[this.shift + 1 + this.step*i] = val;
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
	var mags = new Array(this.spectrWalsh.length).fill(0,0,this.spectrWalsh.length);
    for(var i=1; i<this.spectrWalsh.length; i++){
      var mag = 0;
	  var avg = 0;
	  var c = 0;
	  for(c=0; c<this.spectrWalsh[i].length; c++){
        if(this.spectrWalsh[i][c] !== 0){
			avg += inputarr[c];
		}
      }
	  avg /= c;
      for(var j=0; j<this.spectrWalsh[i].length; j++){
        mag += this.spectrWalsh[i][j]*(inputarr[j]-avg);
      }
	  mags[i] = mag;
    }

	var diff = 0;
	var avg = 0;
	for(var j=1; j<mags.length; j++){
	  avg += mags[j];
    }
	avg /= (mags.length - 1); 
	for(var j=1; j<mags.length; j++){
	  diff += Math.pow(mags[j]-avg, 2);
    }
	diff /= (mags.length - 1);
	this.sigma = Math.sqrt(diff);
	for(var j=1; j<mags.length; j++){
		if(mags[j]>0){
			res[j] = (mags[j]-avg)/this.sigma;
		} else {
			res[j] = 0;
		}
	  
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

  walsh.prototype.encode = function(outputarr){
	var res = [1];
	this.perv = 0;
	for(var i=0; i<outputarr.length; i++){
		var row = this.encodeMatrix[this.perv];
		for(var j=0; j<row.length; j++){
			if(outputarr[i]==row[j]){
				this.perv = j;
				res.push(j+1);
				break;
			}
		}
	}
    return (outputarr.length < 1)? []: res;
  }

  walsh.prototype.decodeSequence = function(sym, detected){
    if(this.first === undefined){
		this.first = sym;
		if(this.timerId !== undefined) clearTimeout(this.timerId)
		this.timerId = setTimeout(this.clearSym, 250 );
		return;
	} else if(this.first === sym){
		if(this.timerId !== undefined) clearTimeout(this.timerId)
		this.timerId = setTimeout(this.clearSym, 250 );
		return;
	} else {
		var res = this.encodeMatrix[this.first-1][sym-1];
		this.first = sym;
		if(this.timerId !== undefined) clearTimeout(this.timerId)
		this.timerId = setTimeout(this.clearSym, 250 );
		if(detected !== undefined) detected(res);
	}
  }  

  walsh.prototype.clearSym = function(){
	if(this.timerId !== undefined) clearTimeout(this.timerId)
	this.first = undefined;  
  }
  
  this.matrix = this.createAdamar([[1,1],[1,-1]]);
 
  this.waves = new Array(this.n);
  this.spectrWalsh = new Array(this.n);
  for(var i=0; i<this.waves.length; i++){
    this.waves[i] = this.getWave(i);
  }
  
}