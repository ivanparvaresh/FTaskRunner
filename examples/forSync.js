var ftask=require("./../index");

ftask({debug:false})
   .build("test",root=>{
                root
                    //.for(2,2)
                    .custom(function(scope,next){
                        //next(1,{keepRunning:true});
                        //next(2,{keepRunning:false});

                        setTimeout(function() {
                            console.log("NEXTING (400) ....")
                            next(1,{keepRunning:true});
                        }, 10);
                        setTimeout(function() {
                            console.log("NEXTING (400) ....")
                            next(2,{keepRunning:false});
                        }, 400);

                        // var index=scope.$$input;
                        // if (index==1){
                        //     setTimeout(function() {
                        //         console.log("NEXTING (400) ....")
                        //         next(scope.$$input);
                        //     }, 400);
                        // }else{
                        //     setTimeout(function() {
                        //         console.log("NEXTING (100) ....")
                        //         try{
                        //             next(scope.$$input,{keepRunning:true});
                        //         }catch(err){
                        //             console.log("err",err);
                        //         }
                        //     }, 10);
                        // }
                    })
            }).run(null)
                .then(function(result){
                    console.log("");
                    console.log("Process Completed");
                    console.log(result);
                    console.log("");
                })
                .catch(function(err){
                    console.log(">>>",err);
                })