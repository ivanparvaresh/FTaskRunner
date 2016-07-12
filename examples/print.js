var ftask=require("./../index");

ftask({debug:false})
    .build("test",function(root){
           
        root
            .string("Javad")
            .print("My name is {0}")
        
    })
    .run(null).then(function(result){
        
        
    }).catch(function(err){
        console.log("");
        console.log("Process execution failed..");
        console.log(err);
        console.log("stack",err.stack);
    });