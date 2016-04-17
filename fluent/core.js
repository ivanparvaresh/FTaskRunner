// export  
module.exports = function (container) {

    var tasks = [];


    tasks.push({
        name: "stop",
        def: function(instance,func) {
            return {};
        },
        exec: function (scope, next) {
            console.log("TERMINATED");
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
            scope.func(scope, next);
        }
    });

    tasks.push({
        name: "historyBack",
        def: function(instance,count) {
            if (count == null) count = 1;
            return {
                count: count
            };
        },
        exec: function (scope, next) {
            for (var i = 1; i < scope.count; i++) {
                scope.$$context.$$history.pop(scope.count);
            }
            next(scope.$$context.$$history[scope.$$context.$$history.length - 1]);
        }
    })
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

            scope.$$log(name, str);

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
            for (var i = scope.start; i <= scope.end; i++) {
                if (i == scope.end)
                    next(i, true);
                else
                    next(i, false);
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
                    next(scope.$$input[i], true);
                else
                    next(scope.$$input[i], false);
            }
        }
    });
    tasks.push({
        name: "fork",
        def: function (instance, forkFunc) {
            var branches = [];
            var builder = function (name) {
                var childInstnace = instance.create();
                branches.push({
                    name:name,
                    instance: childInstnace,
                });
                return childInstnace.root;
            }
            forkFunc(builder); // it should be void
            return {
                branches: branches
            };
        },
        exec: function (scope, next) {

            var done = 0;
            var result = {};
            if (scope.branches.length == 0) {
                next(next.$$input); // pass prv input to next
                return;
            }

            for (var i = 0; i < scope.branches.length; i++) {

                (function (branch) {
                    branch.instance.runner.run(scope.$$input).then(function (branchResult) {
                        result[branch.name]=branchResult;
                        done++;
                        result[branch.name] = branchResult;
                        if (done >= scope.branches.length) {
                            next(result);
                        }
                    }, function (e) {
                        //console.log("BRANCH [" + i + "] REJECTED1");
                        done++;
                        if (done >= scope.branches.length) {
                            next(result);
                        }
                    });
                })(scope.branches[i]); // end of isolatingh
            };
        }
    });

    tasks.push({
        name: "forkSetResult",
        def: function (instance, name) {
            return {
                name: name
            };
        },
        exec: function (scope, next) {
            scope._forkResult = scope.$$input;
            next(scope._forkResult);
        }
    });
    tasks.push({
        name:"if",
        def:function(instance,experssion){
             return {
                experssion: experssion
            };
        },
        exec:function(scope,next){
            var func = Function("value", "return " + scope.experssion)
            var r = func(scope.$$input);
            if (r){
                next(scope.$$input);    
            }
        }
    })
    tasks.push({
        name: "iff",
        def: function (instance, experssion) {
            return {
                experssion: experssion
            };
        },
        exec: function (scope, next) {
            var func = Function("value", "return " + scope.experssion)
            var r = func(scope.$$input);
            next(r);
        }
    });
    tasks.push({
        name: "assert",
        def: function (instance, experssion) {
            return {
                experssion: experssion
            };
        },
        exec: function (scope, next) {
            if (scope.$$input) next(scope.$$input);
        }
    });
    

    return tasks;
}
