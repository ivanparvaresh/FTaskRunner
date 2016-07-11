var ftask=require("./../index");

ftask({debug:true})
    //.load("sd")
    //.load("s")
    //.load("s")
    .build("test",function(root){
           
        root
            .string("hi")
             .fork({
                "f1" : function(root){ root.string("fork1") },
                "f2" : function(root){ root.string("fork2") },
                "f3" : function(root){ root.string("fork3") },
            })
            
        
    })
    .run(null).then(function(result){
        
        console.log("");
        console.log("Process execution completed ");
        console.log("");
        for(instanceName in result){
            var instance=result[instanceName];
            console.log("\t" + instanceName + " (" + instance.time + " ms) ");
            if (instance.err){
                console.log("\t |--- Error : " + instance.err);
                console.log("\t |------ Error : " + instance.err);
                console.log("\t |------ Error : " + instance.err.stack);
            }else{
                console.log("\t |--- Success");
                console.log("\t     |---", JSON.stringify(instance.result));
            }
        }
        console.log("");
        
    }).catch(function(err){
        console.log("");
        console.log("Process execution failed..");
        console.log(err);
        console.log("stack",err.stack);
    });