var ftask=require("./../index");

ftask({debug:true})
    .build("error",function(root){
        
        root
            .wait(root=>{
                root.custom(function(scope,next){
                    throw new Error("hi");
                })
                .string("done");
            })
            .print()
            
        
    })
    .run(null).then(function(result){
        console.log("Result:",result)
    }).catch(function(err){
        console.log("Error2",err);
    });