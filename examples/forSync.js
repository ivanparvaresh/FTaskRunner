var ftask=require("./../index");

ftask({debug:false})
   .build("test",root=>{
                root
                    .for(1,2)
                    .custom(function(scope,next){
                        var index=scope.$$input;
                        //console.log("FOR CUSTOM ",index);
                        if (index==1){
                            setTimeout(function() {
                                console.log("INDEX 1");
                                next(scope.$$input).then(function(r){
                                    //console.log("\t END :",r);
                                });
                            }, 400);
                        }else{
                            setTimeout(function() {
                                next(scope.$$input,{keepRunning:true}).then(function(r){
                                    //console.log("\t RUN :",r);
                                });
                            }, 10);
                        }
                    })
            }).run(null).then(function(result){
                console.log(result);
            })