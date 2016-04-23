 module.exports=function(options){
    
    var ftaskInstance={
        tasks:[],
        builders:[],
        load:function(taskLoader){
            var tsks=taskLoader(this);
            if (tsks==null) return;
            for (var i = 0; i < tsks.length; i++) {
                this.tasks.push(tsks[i]);
            }
            return this;
        },
        build:function(name,builderFunc,parentBuilderInstance){
            var builderInstance=
                createBuilder(name,this,builderFunc,this.tasks,parentBuilderInstance);
            this.builders.push(builderInstance);
                
            return this;
        },
        run:function(input,cb){
            var running=0;
            var result=[];
            for(var i=0;i<this.builders.length;i++){
                running++;
                
                
                (function (builder){
                    var runnerInstance=builder.runner;
                    var start=getTime();
                    runnerInstance.run(input,function(err,instanceResult){
                        
                        
                        running--;
                        var end=getTime();
                        if (err)
                            result[runnerInstance.name]={
                                status:"ERROR",
                                err:err,
                                time:end-start
                            };
                        else{
                            
                            if (result[runnerInstance.name]){
                                
                            }
                            
                            result[runnerInstance.name]={
                                result:instanceResult,
                                status:"SUCCESS",
                                time:end-start
                            };
                        }
                        if (running==0){
                            cb(result);
                        }
                    });
                    
                })(this.builders[i]);
                
            }
        }
    };
    
    function getTime(){
        var hrTime=process.hrtime();
        return Math.floor(hrTime[0] * 1000000 + hrTime[1] / 1000,0);
    }
    
    //------------------------------------------------------------------------------
    //          BUILDER
    //------------------------------------------------------------------------------
    function createBuilder(name,ftask,builderFunc, tasks, parentBuilderInstance) {
        // create root block
        var builderInstance = {};
        builderInstance.name=name;
        builderInstance.ftask = ftask;
        builderInstance.childs = [];
        builderInstance.parent = parentBuilderInstance; // it can be null

        var rootTask={
            name: "rootTask",
            def: function () { return {}; },
            exec: function (scope, next) {
                if (scope.$$input==null){
                    next({});
                }
                else
                {
                    next(scope.$$input);
                }
            }
        };
        builderInstance.root = createBlock(builderInstance,tasks,null, rootTask,null);

        // we can support for child builder ( fork and join support)
        builderInstance.newInstance = function (name,builderFunc) {
            var newInstance = createBuilder(name,ftask,builderFunc, tasks, builderInstance);
            builderInstance.childs.push(newInstance);
            return newInstance;
        }
        
        
        // after end we let use to build the tasks schema
        if (builderFunc!=null){
            builderFunc(builderInstance.root);
        }
        builderInstance.runner=createRunner(builderInstance);
        
        return builderInstance;
    };
    function createBlock(builderInstance,tasks,parentBlock, task, scope) {
        var block = {
            scope: (scope == null) ? {} : scope,
            task: task,
            parent: parentBlock, // it can be null
            childs: []
        };
        makeBlockFluentable(builderInstance,tasks,block);
        return block;
    };
    function makeBlockFluentable(builderInstance, tasks, block) {
        
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            (function (task) {
                block[task.name] = function () {
                    
                    var args = [];
                    args.push(builderInstance);
                    for (var i = 0; i < arguments.length ; i++) {
                        args.push(arguments[i]);
                    }

                    var scope = task.def.apply(
                        this,
                        args /*array of argument which has passed to this function */
                    );

                    if (scope == null)
                        scope = {};

                    var newBlock = createBlock(builderInstance, tasks,block, task, scope);
                    block.childs.push(newBlock);
                    return newBlock;
                };
            })(tasks[i]);
        }
    };
    
    // load core tasks
    ftaskInstance.load(require("./fluent/core.js"));
    return ftaskInstance;
}

//------------------------------------------------------------------------------
//          RUNNER
//------------------------------------------------------------------------------
function createRunner(builderInstance) {
    
    var runnerInstance={
        name:builderInstance.name,
        builder:builderInstance,
        run: function (input,callback) {
            
            var context =
                createContext(null, (input==null) ? {} : input);
            
            exec(builderInstance.root, context, function(err,result){
                if (callback){
                    callback(err,result);
                }
            });
        },
    };
    
    return runnerInstance;
}
function cloneParams(params) {
    if (params == null)
        return [];

    var newObj = [];
    for (var key in params) {
        newObj[key] = JSON.parse(JSON.stringify(params[key]));
    }
    return newObj;
}
function createContext(prntContext, blockScope, input) {

    var scope = {};
    if (typeof(blockScope)==='function'){
        blockScope=blockScope(input);
    }
    for (var prop in blockScope) {
        scope[prop] = blockScope[prop];
    }

    scope.$$params = (prntContext == null) ? [] : cloneParams(prntContext.scope.$$params);
    scope.$$input = (input == null) ? {} : input;
    var context = {
        scope: scope,
        level:1,
    };

    if (prntContext!=null)
        context.level=prntContext.level+1;

    // global context variables container
    scope.$$getParams = function () {
        return scope.$$params;
    };
    scope.$$getParam = function (name) {
        return scope.$$params[name];
    };
    scope.$$addParam = function (name, value) {
        scope.$$params[name] = value;
    };
    
    return context;
}
function exec(block, context, callback) {
    try {
        
        var task   = block.task;
        var scope  = context.scope;
        var level  = context.level;
        
        var log=function(text,level){
            if (1==1) return;
            var data="[" + level + "]" + text;
            for(var i=0;i<level;i++) data= "|---" + data;
            console.log("\t " + data);    
        }
        
        
        log("Executing task:[" + task.name + "], level:["+level+"]",level);
        var results=[];
        
        try{
            
            task.exec(scope,function(out,opts){       
                log(">>Executed:[" + task.name + "], level:["+level+"]",level+1);
                var options={
                    keepRunning:false,
                    terminate:false  
                }
                
                
                if (opts!=null){
                    if (opts.keepRunning){
                        options.keepRunning=opts.keepRunning;
                    }
                    if (opts.terminate){
                        options.terminate=opts.terminate;
                    }
                }
                
                if (options.terminate){
                    throw Error("Process Terminated");
                }
                
                
                if (block.childs.length==0){
                    
                    log(">>Returning Tasks Result("+block.task.name+"): " + out,level+1)
                    results.push(out);
                    
                    if (!options.keepRunning){
                        callback(null,results);
                        return;
                    }
                    return;
                }
                
                
                // when there is child block
                var running=block.childs.length;
                for(var i=0;i<block.childs.length;i++){
                    (function(childBlock){
                        
                        var childContext=
                            createContext(context, childBlock.scope, out);
                        
                        exec(childBlock,childContext,function(err,out){
                            running--;
                            
                            log(">>Accepting Task Result",context.level+2)
                            if (out!=null){
                                for(var i=0;i<out.length;i++){
                                    log(">>" + out[i],context.level+3);
                                    results.push(out[i]);    
                                }
                            }
                            log(">>Accepted Task Result: " + results,context.level+2)
                            
                            
                            if (running==0){
                                if (!options.keepRunning){
                                    log("Returning value : " + results,context.level)
                                    callback(err,results);    
                                }
                            }
                        });
                    })(block.childs[i]);
                } // end of running childs
                
            });
        
        }catch(err){
            callback(err,null);
        }
    }
    catch (er) {
        callback(er,null);
    }
}