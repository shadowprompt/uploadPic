(function(){
	var uploadInfo={ //第一个上传文件框对应信息
		0:{
			"uploadDiv":"",
			"fileInput":"",
			"image":"",
			"thumbnail":"", 
			"arr":[], //存储上传图片的base64信息，
			"hash":[] //存储上传图片的文件名
		},
		1:{
			"uploadDiv":"",
			"fileInput":"",
			"image":"",
			"thumbnail":"",
			"arr":[],
			"hash":[]
		}
	};
	uploadArea(0);
	uploadArea(1);
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext('2d');
	//    瓦片canvas
	var tCanvas = document.createElement("canvas");
	var tctx = tCanvas.getContext("2d");
	function uploadArea(num){				
		uploadInfo[num].uploadDiv = document.getElementById("upload"+num);
		uploadInfo[num].fileInput = document.getElementById("upload-image"+num);
		var limit = {
			maxSize: 1000,  //单位kb
			maxNum: 2
		};
		var tips= {
			maxSize: "请您上传小于" + limit.maxSize + "kb的图片",
			maxNum: "您上传的图片不得超过" + limit.maxNum + "张",
			duplicate: "您上传的图片不能重复",
			imagesType: "请上传jpg,jpeg,png,gif,bmp格式的图片"
		};

		uploadInfo[num].fileInput.addEventListener("change",function(e){
		  var files = this.files;
		  showThumbnail(files,num);
		},false);

		uploadInfo[num].uploadDiv.addEventListener("click",function(e){
		  $(uploadInfo[num].fileInput).show().focus().click().hide();
		  e.preventDefault();
		},false)

		uploadInfo[num].uploadDiv.addEventListener("dragenter",function(e){
		  e.stopPropagation();
		  e.preventDefault();
		},false);

		uploadInfo[num].uploadDiv.addEventListener("dragover",function(e){
		  e.stopPropagation();
		  e.preventDefault();
		},false);

		uploadInfo[num].uploadDiv.addEventListener("drop",function(e){
		  e.stopPropagation();
		  e.preventDefault();
		  console.log(e);
		  var dt = e.dataTransfer;
		  var files = dt.files;
		  showThumbnail(files,num)
		},false);

		//将一次上次的所有文件绘画缩略图
		function showThumbnail(files, num){
			for(var i=0;i<files.length&&i<limit.maxNum;i++){ //多个上传，超出个数直接忽略
		  	//用于跳出两层循环
		  	var duplicate=false;
		    var file = files[i];
		    
		    console.log(file);
      	

    	  if(!file.type.match(/image.*/)){
    	    console.log(tips.imagesType);
    	    continue;
    	  };
    	  var namesize = file.name +""+ file.size;
    	  for(var j=0;j<uploadInfo[num].hash.length;j++){
    	  	if(namesize == uploadInfo[num].hash[j]){
    	  		console.log("重复");
    	  		duplicate = true;
    	  		break;
    	  	}
    	  	console.log("j= " +j);
    	  }
    	  if(duplicate){
    	  	continue;
    	  }
    	  if(uploadInfo[num].arr.length>=limit.maxNum){
    			console.log(tips.maxNum);
    			break;
    		}

        var reader = new FileReader();
        reader.onload = function() {
        	//缩略图用压缩前的
          // uploadInfo[num].image.src = result;
          var img = new Image();
          img.src = this.result;

  				//图片加载完毕之后进行压缩，然后上传
          if (img.complete) {
            callback();
          } else {
            img.onload = callback; //图片加载完成时执行
          }
          function callback() {
            var data = compress(img);
            
          	if(data.size > limit.maxSize*1024){  //如果图片压缩后的大小超过maxSize，提示
        	  	console.log(tips.maxSize);
        	  	return;
        	  }else{
	  	    	  //图片合格则储存相关信息
	  			    uploadInfo[num].image = document.createElement("img")
	  			    uploadInfo[num].thumbnail = document.getElementById("thumbnail"+num);
	  			    uploadInfo[num].image.file = file;
	  			    uploadInfo[num].hash.push(file.name + file.size);
	  			    uploadInfo[num].arr.push(data);
	  			    //缩略图用的压缩后的
	  			    uploadInfo[num].image.src = data;
	  			    if(uploadInfo[num].arr.length>limit.maxNum-1){
			    			uploadInfo[num].uploadDiv.style.display="none";
			    		}
	  			    uploadInfo[num].thumbnail.insertBefore(uploadInfo[num].image, uploadInfo[num].uploadDiv);
  			     //为每张图片添加点击事件，点击图片时删除
  			    	$(uploadInfo[num].image).on('click', function(){
  			    		$(this).remove();
  			    		//循环判断并删除
  			    		for(i in uploadInfo[num].arr){
  			    			if($(this)[0].currentSrc == uploadInfo[num].arr[i]){
  			    				uploadInfo[num].arr.splice(i,1);
  			    				uploadInfo[num].hash.splice(i,1);
  			    			}
  			    		}
  			    		//删除图片时检查图片总数是否小于maxNum，小于则继续显示上次“按钮”
  			    		if(uploadInfo[num].arr.length<limit.maxNum){
  			    			uploadInfo[num].uploadDiv.style.display="block";
  			    		}
  			    		console.log(uploadInfo[num]);
  			    	});
        	  }
        	  console.log(uploadInfo);
            img = null;
          }
        };
        reader.readAsDataURL(file);
		  }
		};
	};
	//压缩图片base64
  function compress(img) {
    var initSize = img.src.length;
    var width = img.width;
    var height = img.height;
    //如果图片大于四百万像素，计算压缩比并将大小压至400万以下
    var ratio;
    if ((ratio = width * height / 4000000)>1) {
        ratio = Math.sqrt(ratio);
        width /= ratio;
        height /= ratio;
    }else {
        ratio = 1;
    }
    canvas.width = width;
    canvas.height = height;
  //	铺底色
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    //如果图片像素大于100万则使用瓦片绘制
    var count;
    if ((count = width * height / 1000000) > 1) {
        count = ~~(Math.sqrt(count)+1); //计算要分成多少块瓦片
  //	    计算每块瓦片的宽和高
        var nw = ~~(width / count);
        var nh = ~~(height / count);
        tCanvas.width = nw;
        tCanvas.height = nh;
        for (var i = 0; i < count; i++) {
      for (var j = 0; j < count; j++) {
          tctx.drawImage(img, i * nw * ratio, j * nh * ratio, nw * ratio, nh * ratio, 0, 0, nw, nh);
          ctx.drawImage(tCanvas, i * nw, j * nh, nw, nh);
      }
        }
    } else {
        ctx.drawImage(img, 0, 0, width, height);
    }
    //进行最小压缩
    var ndata = canvas.toDataURL('image/jpeg', 0.1);
    console.log('压缩前：' + initSize);
    console.log('压缩后：' + ndata.length);
    console.log('压缩率：' + ~~(100 * (initSize - ndata.length) / initSize) + "%");
    tCanvas.width = tCanvas.height = canvas.width = canvas.height = 0;
    return ndata;
	}
})();	