function walsh(n, shift, step, dimension,  tresholdTimeout){
  walsh.prototype.this = this;
  this.n = (n !== undefined)? n: 64;
  this.shift = (shift !== undefined)? shift: 45;
  this.step = (step !== undefined)? step: 3;
  this.dimension = (dimension !== undefined)? dimension : 2;
  this.tresholdTimeout = (tresholdTimeout !== undefined)? tresholdTimeout: 100;
  this.maxCodeLength = ((Math.pow(this.n/this.dimension, this.dimension)-1).toString(2)).length;
  this.dimesionLength = this.maxCodeLength/this.dimension|0;
  this.maxSigma = 3.5
  
  walsh.prototype.getCodes = function(code){
    var codeBin = code.toString(2);
    if(codeBin.length < this.maxCodeLength){
		codeBin = '0'.repeat(this.maxCodeLength - codeBin.length) + codeBin;
	}else if(codeBin.length > this.maxCodeLength){
		codeBin = codeBin.substr(codeBin.length - this.maxCodeLength, this.maxCodeLength)
	}
    var res = [];
    for(var i=0; i<this.dimension; i++){
		res.push(parseInt(codeBin.substr(i*this.dimesionLength, this.dimesionLength), 2));
	}
    
	return res;
  }	
  
  walsh.prototype.getWave = function(code){
    var codeArr = new Array(this.matrix.length).fill(0,0,this.matrix.length);
    var codes = this.getCodes(code);
    for(var i=0; i<codes.length; i++){
        var currentCode = this.matrix[codes[i] + (i*(this.matrix.length/this.dimension|0))];
		for(var j=0;j<codeArr.length;j++){
			codeArr[j] = codeArr[j] + currentCode[j];
		}
	}
	
    var lengthOfFFT = this.shift + 1 + codeArr.length*this.step*2;
    var res = new Array(lengthOfFFT).fill(0,0,lengthOfFFT);
    
    for(var i= 0; i<codeArr.length; i++){
      var val = 0;
      if (codeArr[i] > 0) {
		res[this.shift + 1 + this.step*i*2] = 1
      }
      else if (codeArr[i] < 0) {
		res[this.shift + 1 + this.step*i*2+this.step] = 1
	  }
    }
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
    for(var i=0; i<this.matrix.length; i++){
      var mag = 0;
      for(var j=0; j<this.matrix.length; j++){
        var positive = inputarr[this.shift + 1 + this.step*j*2];
		var negative = inputarr[this.shift + 1 + this.step*j*2+this.step];
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
	for(var j=0; j<mags.length; j++){
		res[j] = (mags[j]> avg)? (mags[j]-avg)/this.sigma : 0;  
    }
	
    var codeArr = [];
	for (var i=0; i<this.dimension; i++){
		var maxMagn = 0;
		var codeBin = undefined;
		for(var j=0; j<mags.length/this.dimension|0; j++){
			if((res[j+i*(mags.length/this.dimension|0)]>maxMagn) && res[j+i*(mags.length/this.dimension|0)]>this.maxSigma){
				maxMagn = res[j+i*(mags.length/this.dimension|0)];
				codeBin = j;
			}
		}
		if(codeBin === undefined) return undefined;
		codeArr.push(codeBin);
	}
	codeArr = codeArr.reverse();
    var charCode = 0;
	for(var i=0; i<codeArr.length;i++){
		charCode += (Math.pow(mags.length/this.dimension|0, i)*codeArr[i]);
	}

    return charCode;
  };

  // Encode sequece of sym to prevent repeating
  walsh.prototype.encode = function(outputarr){
	var res = [];
	this.perv = 0;
	for(var i=0; i<outputarr.length; i++){
		var sym = outputarr[i]+1;
        if(sym > Math.pow(this.n/this.dimension, this.dimension)) throw ("There have not to be value more than " + (Math.pow(this.n/this.dimension, this.dimension) - 1))
	    if(i==0){
			res.push(sym);
			this.perv = sym;			
		}
		if(sym>this.perv){
			this.perv = sym;
			res.push(sym);			
		} else {
            sym -= 1;
			this.perv = sym;
			res.push(sym);	
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
		//if(this.timerId !== undefined) clearTimeout(this.timerId)
		//this.timerId = setTimeout(this.clearSym, this.tresholdTimeout );
		return;
	} else if(this.first === sym){
		//if(this.timerId !== undefined) clearTimeout(this.timerId)
		//this.timerId = setTimeout(this.clearSym, this.tresholdTimeout );
		return;
	} else {
        var res;
		if(this.first>sym){
			res = sym+1;
		} else {
			res = sym;
		}
		this.first = sym;
		//if(this.timerId !== undefined) clearTimeout(this.timerId)
		//this.timerId = setTimeout(this.clearSym, this.tresholdTimeout );
		if(detected !== undefined) detected(res-1);
	}
  }  

  walsh.prototype.clearSym = function(){
	if(walsh.prototype.this.timerId !== undefined) clearTimeout(walsh.prototype.this.timerId)
	walsh.prototype.this.first = undefined;  
  }
  
  this.matrix = this.createAdamar([[1,1],[1,-1]]);
 
  
}