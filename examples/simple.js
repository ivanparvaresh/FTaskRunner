var ftask=require("./../ftaskrunner");

ftask()
    //.load("sd")
    //.load("s")
    //.load("s")
    .create(function(root){
        
        root
            .string("fuck")
            .print()
            .stop()
        
    })
    .run("test");