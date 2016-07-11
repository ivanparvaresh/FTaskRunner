var ftask=require("./../index");

ftask({debug:false})
   .build("test",root=>{
                root

                    // .forSync(1,2)
                    // .forSync(3,4)
                    // .custom(function(scope,next){
                    //     next("CUSTOM A "+ scope.$$input,{keepRunning:true});
                    //     next("CUSTOM A "+ scope.$$input);
                    // })

                    .forSync(1,2)
                    .custom(function(scope,next){
                        var index=scope.$$input;
                        if (index==1){
                            setTimeout(function() {
                                next(scope.$$input,{keepRunning:false});
                            }, 400);
                        }else{
                            setTimeout(function() {
                                next(scope.$$input,{keepRunning:false})
                            }, 10);
                        }
                    });
            }).run(null)
                .then(function(result){
                    console.log("");
                    console.log("Process Completed");
                    console.log(result);
                    //console.log(result.test.result);
                    console.log("");
                })
                .catch(function(err){
                    console.log(">>>",err);
                })