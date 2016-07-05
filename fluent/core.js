// export  
module.exports = function (container) {

    var tasks = [];

    tasks.push({
        name: "stop",
        def: function(instance,func) {
            return {};
        },
        exec: function (scope, next) {
            next(null,{ terminate:true })
        }
    });

    tasks.push({
        name: "input",
        def: function (instance,input) {
            return {
                input:input
            };
        },
        exec: function (scope, next) {

            var input=scope.input;
            if (typeof scope.input === 'function'){
                input=scope.input(scope);
            }

            next(input);
        }
    });
    
    tasks.push({
        name: "custom",
        def: function(instance,func) {
            return {
                func: func
            };
        },
        exec: function (scope, next) {
            if (scope.func){
                scope.func(scope, next);    
            }else{
                next(scope.$$input);
            }
            
        }
    });

   
    tasks.push({
        name: "addParam",
        def: function(instance,name) {
            return {
                name: name
            }
        },
        exec: function (scope, next) {
            scope.$$addParam(scope.name, scope.$$input);
            next(scope.$$input);
        }
    });
    tasks.push({
        name: "pushParam",
        def: function(instance,name) {
            return {
                name: name
            }
        },
        exec: function (scope, next) {
            var param = scope.$$getParam(scope.name);
            if (param == null) {
                param = [];
                scope.$$addParam(scope.name, param);
            }
            param.push(scope.$$input);

            next(scope.$$input);
        }
    })
    tasks.push({
        name: "getParam",
        def: function(instance,name) {
            return {
                name: name
            };
        },
        exec: function (scope, next) {
            next(scope.$$getParam(scope.name));
        }
    });
    
    // output
    tasks.push({
        name: "print",

        def: function (instacne,name,params) {
            return {
                name: name,
                params: params
            }
        },
        exec: function (scope, next) {

            var str = scope.$$input;
            var name = (scope.name == null) ? "" : scope.name;
            if (scope.params != null) {

                for (var i = 0; i < scope.params.length; i++) {
                    str = str.replace("{" + scope.params[i] + "}", scope.$$getParam(scope.params[i]));
                    name = name.replace("{" + scope.params[i] + "}", scope.$$getParam(scope.params[i]));
                }
            }
            console.log(str);
            next(scope.$$input);
        }
    });
    
    //util
    tasks.push({
        name: "string",
        def: function (instance, string) {
            return {
                string: string
            };
        },
        exec: function (scope, next) {
            next(scope.string);
        }
    });
    tasks.push({
        name: "delay",
        def: function(time) {
            return time;
        },
        exec: function(scope, next) {

			if (scope.time==null){
				scope.time=10000;
			}
			setTimeout(function() {
				next(scope.$$input);
			}, scope.time);
        }
    });
    
    //flow
    tasks.push({
        name: "for",
        def: function (instance, start, end) {
            return {
                start: start,
                end: end
            };
        },
        exec: function (scope, next) {

            if (scope.start==null || scope.end==null){
                scope.start=scope.$$input.start;
                scope.end=scope.$$input.end;
            }

            for (var i = scope.start; i <= scope.end; i++) {
                if (i == scope.end)
                    next(i);
                else
                    next(i,{ keepRunning:true });
            }
        }
    });
    tasks.push({
        name: "foreach",
        def: function (instance) {
            return {};
        },
        exec: function (scope, next) {
            for (var i = 0; i < scope.$$input.length; i++) {
                if (i == scope.$$input.length-1)
                    next(scope.$$input[i]);
                else
                    next(scope.$$input[i], { keepRunning:true });
            }
        }
    });
    tasks.push({
        name:"rif",
        def:function(instance,conditionFunc,builderFunc){

            var builderInstance=
                instance.newInstance("IIF_BRANCH",builderFunc);
            
            return {
                builderInstance:builderInstance,
                conditionFunc:conditionFunc
            };
        },
        exec:function(scope,next){

            if (!scope.conditionFunc(scope)){
                next(scope.$$input);
                return;
            }

            var builderInstance
                =scope.builderInstance;
            builderInstance.runner.runByContext(scope.getContext(),scope.$$input,function(err,result){
                if (err){
                    throw err;
                }
                next(result[0]);
            })

        }
    })

    tasks.push({
        name: "fork",
        def: function (instance, brnchDefs) {
            
            var branches = [];
            for(var name in brnchDefs){
                
                (function(name,func){
                     
                    var builderInstance=
                        instance.newInstance(name,func);
                        
                    branches.push(builderInstance);
                    
                })(name,brnchDefs[name]);
            }
            
            return {
                branches: branches
            };
        },
        exec: function (scope, next) {

            var done = 0;
            var forkResult = {};
            
            if (scope.branches.length == 0) {
                next(next.$$input); // pass prv input to next
                return;
            }

            for (var i = 0; i < scope.branches.length; i++) {

                (function (branch) {
                    branch.runner.runByContext(scope.getContext(),scope.$$input,function(err,results){
                        done++;
                        forkResult[branch.name]=results;
                        if (done >= scope.branches.length) {
                            next(forkResult);
                        }
                    });
                })(scope.branches[i]); // end of isolatingh
            };
        }
    });

    
    tasks.push({
        name:"wait",
        def:function(instance,func){

            var builderInstance=
                instance.newInstance("WAIT_BRANCH",func);
            
            return { builderInstance :builderInstance };
        },
        exec:function(scope, next){
            var builderInstance
                =scope.builderInstance;
            builderInstance.runner.runByContext(scope.getContext(),scope.$$input,function(err,result){
                if (err){
                    throw err;
                }
                next(result);
            })
        }
    })
    
    

    return tasks;
}
