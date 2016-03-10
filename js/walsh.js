function walsh(n, shift, step){
  walsh.prototype.this = this;
  this.n = n;
  this.shift = shift;
  this.step = step;
  
  walsh.prototype.getWave = function(code){
    var codeArr = this.matrix[code];
    var lengthOfFFT = this.shift + 1 + codeArr.length*step;
    var res = new Array(lengthOfFFT).fill(0.5,0,lengthOfFFT);
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
    for(var i=0; i<this.spectrWalsh.length; i++){
      var mag = 0;
      for(var j=0; j<this.spectrWalsh[i].length; j++){
        mag += this.spectrWalsh[i][j]*inputarr[j];
      }
      res[i]=mag;
    }
      
    return res;
  }; 
  
  this.matrix = this.createAdamar([[1,1],[1,-1]]);
 
  this.waves = new Array(n);
  this.spectrWalsh = new Array(n);
  for(var i=0; i<this.waves.length; i++){
    this.waves[i] = this.getWave(i);
  }
  
}