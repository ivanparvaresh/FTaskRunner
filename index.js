
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
    var log=function(level){
        if (!options.debug) return;
        var level=arguments[0];

        var data="["+level+"]";
        for(var i=0;i<level;i++) data= data + "--|--";

        var args=[];
        args.push(data);
        for(var i=1;i<arguments.length;i++){
            args.push(arguments[i]);
        }
        
        
        console.log.apply(this,args);
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
            nextBlock:null
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

                    var nextBlock = createBlock(builderInstance, tasks,block, task, scope);
                    block.nextBlock=nextBlock;
                    return nextBlock;
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
                return exec(builderInstance.root,context);
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
            var results=[];
            var branchs=0;

            log(level,"Executing task [" + task.name + "]","{","input:",scope.$$input,"}");
            task.exec(scope,function(out,opts){
                branchs++;
                return new Promise(function(resolveTask,rejectTask){

                    var options={
                        keepRunning:false,
                        terminate:false  ,
                        errorReport:false,
                    }
                    if (opts!=null){
                        if (opts.keepRunning){
                            options.keepRunning=opts.keepRunning;
                        }
                        if (opts.terminate){
                            options.terminate=opts.terminate;
                        }
                        if (opts.errorReport){
                            options.errorReport=opts.errorReport;
                        }
                    }
                    
                    log(level,">> Task executed [" + task.name + "]","{","output:",out,",","options:",options,"}");
                    if (options.errorReport){
                        log(level,">> Task reported an error [" + task.name + "]","{","error:",out,"}");
                        reject(out)
                        resolveTask(results);
                        return;
                    }

                    log(level,">> Task executed [" + task.name + "]","{","output:",out,",","options:",options,"}");
                    if (options.terminate){
                        log(level,">> Task terminated [" + task.name + "]","{","results:",results,"}");
                        resolveTask(results);
                        return;
                    }

                    if (block.nextBlock==null){
                        results.push(out);
                        if (!options.keepRunning){
                            log(level,">> Flow is ended, Returning Task Result [" + task.name + "]","{","results:",results,"}");
                            resolveTask(results);
                            resolve(results);
                        }else{
                            log(level,">> Flow is ended, But task is still running [" + task.name + "]");
                            resolveTask(results);
                        }
                    }else{

                        childBlock=block.nextBlock;
                        var childContext=
                                createContext(context, childBlock.scope, out);
                            
                        log(level,">> Executing Task [" + task.name + "->"+childBlock.task.name+"]","{","input:",out,"}");
                        exec(childBlock,childContext).then(function(out){
                            log(level,">> Task Resolved [" + task.name + "->"+childBlock.task.name+"]","{","out:",out,"}");
                            
                            for(var i=0;i<out.length;i++){
                                results.push(out[i]);
                            }
                            if (!options.keepRunning){
                                log(level,">> Task Resolved completely [" + task.name + "->"+childBlock.task.name+"]","{","results:",results,"}");
                                resolve(results);
                                resolveTask(results);
                            }else{
                                log(level,">> Task Resolved, but task is still running [" + task.name + "->"+childBlock.task.name+"]");
                                resolveTask(results);
                            }

                        }).catch(function(err){
                            log(level,">> Task ["+task.name+"->"+childBlock.task.name+"] execution Failed","{","error:",err,"}");
                            rejectTask(err);
                            reject(err);
                            return;
                        });
                    } // end of next block


                });
            });
        })
    } // end of exec function
    
    
    
    // load core tasks
    ftaskInstance.load(require("./fluent/core.js"));
    return ftaskInstance;
}