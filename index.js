var path = require("path");
var fs = require("fs");

// local
var rootThis = this;
var config = {
    verbose: false,
    src: "",
    tasks:[]
}

// task managment
function loadTasks(localTasks) {

    try {

        var handlersPath = path.join(__dirname, "fluent");
        var tasks = [];

        fs.readdirSync(handlersPath).forEach(function (handlerFile) {
            var _tasks = require("./fluent/" + handlerFile)();
            for (var i = 0; i < _tasks.length; i++) {
                tasks.push(_tasks[i]);
            }
        });

        for (var j = 0; j < localTasks.length; j++) {
            var _tasks = require(localTasks[j])();
            for (var i = 0; i < _tasks.length; i++) {
                tasks.push(_tasks[i]);
            }

        }
        return tasks;
    }
    catch (e) {
        console.log("Error on loading tasks", e);
        new Error(e);
    }
}

//executing methods
function cloneParams(params) {
    if (params == null)
        return [];

    var newObj = [];
    for (var key in params) {
        newObj[key] = JSON.parse(JSON.stringify(params[key]));
    }
    return newObj;
}
function exec(path,block, context, callback) {
    try {

        var level = context.level;
        var task = block.task;
        var scope = context.scope;

        scope.$$debug("[" + path + "]", "Exec [" + task.name + "]");
        var branchNumber = 0;
        task.exec(scope, function (out, inProgress) {
            
            if (block.childs != null && block.childs.length!=0) {
                for (var i = 0; i < block.childs.length; i++) {
                    (function (childBlock) {
                        var childContext = createContext(context, childBlock.scope, out);
                        exec(path + ">" + branchNumber, childBlock, childContext, function (err,result) {
                            if (err) 
                                callback(err,null);
                            else
                                if (!inProgress) callback(null,result);
                        });
                        branchNumber++;
                    })(block.childs[i]);
                }
            } else {
                callback(null,out);
            }

        });
    }
    catch (er) {
        callback(er,null);
        scope.$$log("Task '" + block.level + "','" + block.task.name + "' executed by error " + er);
    }
}
function createContext(prntContext, blockScope, input) {

    var scope = {};
    if (typeof(blockScope)==='function'){
        blockScope=blockScope(input);
    }
    for (var prop in blockScope) {
        scope[prop] = blockScope[prop];
    }

    var level = (prntContext == null) ? 1 : prntContext.level + 1;
    scope.$$params = (prntContext == null) ? [] : cloneParams(prntContext.scope.$$params);
    scope.$$input = (input == null) ? {} : input;
    var context = {
        level: level,
        scope: scope,
    };

    // global context variables container
    scope.$$getParam = function (name) {
        return scope.$$params[name];
    };
    scope.$$addParam = function (name, value) {
        scope.$$params[name] = value;
    };
    scope.$$log = function (msg) {

        var st = "";
        if (config.verbose) {
            for (var i = 0; i < level; i++) {
                st += "\t";
            }
        }
        var arr = [st];
        for (var i = 0; i < arguments.length; i++)
            arr.push(arguments[i]);
        console.log.apply(console, arr);
    }
    scope.$$debug = function (msg) {
        if (!config.verbose)
            return;
        var st = "";
        for (var i = 0; i < level; i++) {
            st += "\t";
        }
        var arr = [st];
        for (var i = 0; i < arguments.length; i++)
            arr.push(arguments[i]);
        console.log.apply(console, arr);
    }
    return context;
}
function createRunner(block) {
    return {
        run: function (input,callback) {
            var context =
                createContext(null, (input==null) ? {} : input);
                
            block.task = {
                name: "rootTask",
                def: function () { return {}; },
                exec: function (scope, next) {
                    if (input==null){
                      next({});
                    }
                    else
                    {
                      next(input);
                    }
                }
            };
            exec("",block, context, function(err,result){
                if (callback){
                    callback(err,result);
                }
            });
        },
    };
}

// builder methods
function makeBlockFluentable(instance, tasks, block) {
    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        (function (task) {
            block[task.name] = function () {

                var args = [];
                args.push(instance);
                for (var i = 0; i < arguments.length ; i++) {
                    args.push(arguments[i]);
                }

                var scope = task.def.apply(
                    this,
                    args /*array of argument which has passed to this function */
                );

                if (scope == null)
                    scope = {};

                var newBlock = createBlock(block, task, scope);
                makeBlockFluentable(instance, tasks, newBlock)
                block.childs.push(newBlock);
                return newBlock;
            };
        })(tasks[i]);
    }
}
function createBlock(parent, task, scope) {
    var block = {
        level: (parent == null) ? 1 : parent.level + 1,
        scope: (scope == null) ? {} : scope,
        task: task,
        parent: parent,
        childs: []
    };
    return block;
}

// instances
function createInstance(builder, tasks, parentInstance) {

    // create root block
    var instance = {};
    instance.builder = rootThis;
    instance.childs = [];
    instance.parent = parentInstance;

    // create root object
    var root = createBlock(null, null);
    makeBlockFluentable(instance, tasks, root);

    instance.root = root;

    // child support=
    instance.create = function () {
        var childInstance = createInstance(null, tasks, instance);
        instance.childs.push(childInstance);
        return childInstance;
    }

    if (builder!=null){
        builder(instance.root);
    }
    instance.runner = createRunner(root);
    instance.run=function(input,callback){
        instance.runner.run(input,callback);
    }



    return instance;
}
// export
module.exports=function(){
    
    var container={
        tasks:[],
        load:function(fluentSchema){
            var tsks=fluentSchema(this);
            if (tsks==null) return;
            for (var i = 0; i < tsks.length; i++) {
                this.tasks.push(tsks[i]);
            }
            return this;
        },
        create:function(func){
            var tasks=loadTasks(this.tasks);
            return createInstance(func, tasks);
        }
    };
    return container;
}