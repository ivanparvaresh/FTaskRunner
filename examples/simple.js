var ftask=require("./../index");

ftask()
    //.load("sd")
    //.load("s")
    //.load("s")
    .build("test",function(root){
           
        root
            
             .fork({
                "f1" : function(root){ root.string("fork1") },
                "f2" : function(root){ root.string("fork2") },
                "f3" : function(root){ root.string("fork3") },
            })
            
        
    })
    .run(null,function(result){
        
        console.log("");
        console.log("Process execution completed ");
        console.log("");
        for(instanceName in result){
            var instance=result[instanceName];
            console.log("\t" + instanceName + " (" + instance.time + " ms) ");
            if (instance.err){
                console.log("\t |--- Error : " + instance.err);
                console.log("\t |------ Error : " + instance.err);
            }else{
                console.log("\t |--- Success");
                console.log("\t     |---", JSON.stringify(instance.result));
            }
        }
        console.log("");
        
    });