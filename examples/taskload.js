var ftask=require("./../index");

var taskSchema=function(container){
    
    var tasks=[];
    
    tasks.push({
       
       name: "mysqlQuery",
       def: function (instacne,name) {
            return { name : name }
       },
       exec:function(scope,next){
           console.log("This is ", scope.name);
           next(scope.name);
       }
        
    });
    
    return tasks;
    
}

ftask()
    .load(taskSchema)
    .create(function(root){
        
        root
            .string("fuck")
            .print()
            .stop()
        
    })
    .run("test");