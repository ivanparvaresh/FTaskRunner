var ftask=require("./../index");

ftask()
    .build("error",function(root){
        
        root
            .for(1,3)
            .wait(root=>{
                root.custom(function(scope,next){
                    next(data);
                })
                .string("done");
            })
            .print()
            
        
    })
    .run(null,function(result){
        console.log("result:",result)
    });