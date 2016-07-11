
//------------------------------------------------------------------------------
//          MODULE
//------------------------------------------------------------------------------
module.exports=function(options){

    if (options==null)
        options={};

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
        run:function(input){
            var me=this;
            return new Promise(function(resolve,reject){

                var running=0;
                var results=[];

                for(var i=0;i<me.builders.length;i++){
                    running++;
                    
                    (function (builder){

                        var runnerInstance=builder.runner;
                        var start=getTime();

                        function onBranchCompleted(name,result){
                            running--;
                            results[name]=result;

                            if (running==0){
                                resolve(results);
                            }
                        }


                        var end=getTime();
                        runnerInstance.run(null,input)
                            .then(function(instanceResult){
                                onBranchCompleted(runnerInstance.name,{
                                    result:instanceResult,
                                    status:"SUCCESS",
                                    time:end-start
                                });
                            }).catch(function(err){
                                onBranchCompleted(runnerInstance.name,{
                                    status:"ERROR",
                                    err:err,
                                    time:end-start
                                });
                            });

                    })(me.builders[i]);
                }    
            }); // end of run promise
        } // end of run
    };
    


    //------------------------------------------------------------------------------
    //          UTILITIEZ
    //------------------------------------------------------------------------------
    function getTime(){
        var hrTime=process.hrtime();
        return Math.floor(hrTime[0] * 1000000 + hrTime[1] / 1000,0);
    }
    var log=function(text,level){
        if ( options.debug ){
            var data="[" + level + "]" + text;
            for(var i=0;i<level;i++) data= "|---" + data;
            log2("\t " + data);
        }
    }
    var log2=function(){
        console.log.apply(this,arguments);
    }


    //------------------------------------------------------------------------------
    //          BUILDER
    //------------------------------------------------------------------------------
    function createBuilder(name,ftask,builderFunc, tasks, parentBuilderInstance) {
        // create root block
        var builderInstance = {};
        builderInstance.name = name;
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
        builderInstance.root 
            = createBlock(builderInstance,tasks,null, rootTask,null);

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
    } // end of create builder

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



    //------------------------------------------------------------------------------
    //          RUNNER
    //------------------------------------------------------------------------------
    function createRunner(builderInstance) {
        
        var runnerInstance={
            name:builderInstance.name,
            builder:builderInstance,
            run: function (prntContext,input) {
                var context =
                    createContext(prntContext, null,(input==null) ? {} : input);
                return exec(builderInstance.root,context)
                    .then(function(d){
                        log2(">>>",d);
                        return d;
                    })
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
        scope.getContext=function(){
            return context;
        }
        
        return context;
    }
    function exec(block, context) {

        return new Promise(function(resolve,reject){

            var task   = block.task;
            var scope  = context.scope;
            var level  = context.level;

            log("Executing task:[" + task.name + "], level:["+level+"]",level);
            var results=[];

            log2("["+level+"]","'"+task.name+"'","Before Exec","Input:",scope.$$input);

            task.exec(scope,function(out,opts){

                return new Promise(function(resolveTask,rejectTask){

                    log2("["+level+"]","\t","'"+task.name+"'","Resolved","Out:",out,"options:",opts);
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
                        log("Terminated " + results,context.level);
                        resolveTask(results);
                        return;
                    }

                    if (block.childs.length==0){
                        log2("["+level+"]","\t","'"+task.name+"'","No Child","options:",options);
                        log(">>Returning Tasks Result("+block.task.name+"): " + out,level+1)
                        results.push(out);
                        log2("["+level+"]","\t","'"+task.name+"'","Result Updated:",results);
                        if (!options.keepRunning){
                            log2("["+level+"]","\t","'"+task.name+"'","Resolving...");
                            resolveTask(results);
                            resolve(results);
                            return;
                        }
                        log2("["+level+"]","\t","'"+task.name+"'","Resolving Task and kepp running...");
                        resolveTask(results);
                        return;
                    }

                    // when there is child block
                    var running=block.childs.length;
                    for(var i=0;i<block.childs.length;i++){
                        (function(childBlock){ 
                            var childContext=
                                createContext(context, childBlock.scope, out);
                            
                            log2("["+level+"]","'"+task.name+"'","->","'"+childBlock.task.name+"'","Before Exec","Input:",out);
                            exec(childBlock,childContext).then(function(out){
                                log2("["+level+"]","'"+task.name+"'","->","'"+childBlock.task.name+"'","Resolved","Out:",out);

                                running--;
                                log(">>Accepted Task Result: " + results,context.level+2,out)
                                
                                if (running==0){
                                    log2("["+level+"]","'"+task.name+"'","->","'"+childBlock.task.name+"'","No Running","options:",options);
                                    if (!options.keepRunning){
                                        log("Returning value : " + results,context.level)
                                        log2("["+level+"]","'"+task.name+"'","->","'"+childBlock.task.name+"'","Resolving completly the task",results);
                                        results=out;
                                        resolve(results);
                                        resolveTask(results);
                                    }else{
                                        log2("["+level+"]","'"+task.name+"'","->","'"+childBlock.task.name+"'","Resolving task and keep running");
                                        resolveTask(results);
                                    }
                                } // running =0

                            }).catch(function(err){
                                log2("ERROR","error:",err);
                                log("Error " + results,context.level,err);
                                rejectTask(err);
                                reject(err);
                                return;
                            });

                        })(block.childs[i]);
                    } // end of running childs


                }).catch(function(err){
                    log2("err",err);
                    reject(err);
                    throw err;
                })

                
            });
        })
    } // end of exec function
    
    
    
    // load core tasks
    ftaskInstance.load(require("./fluent/core.js"));
    return ftaskInstance;
}