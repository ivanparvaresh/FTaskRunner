FTaskRunner
=========== 

[![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000)](https://github.com/javadparvaresh/FTaskRunner/blob/master/LICENSE)
[![Latest Stable Version](http://img.shields.io/github/release/javadparvaresh/FTaskRunner.svg)](https://github.com/javadparvaresh/FTaskRunner)
[![Total Downloads](https://img.shields.io/github/downloads/javadparvaresh/FtaskRunner/total.svg)](https://github.com/javadparvaresh/FTaskRunner)


FTaskRunner is a Node-JS library that lets you to create a flunet way tasks and 
execute them asynchronous. this library is and will stay open soruce.

> its not for long running process


## Installation
```shell
    npm install FtaskRunner
```

## Usage

###1. Simple
  
```javascript
var ftask=require("ftaskrunner");
ftask.build("helloWorld"function(root){
    
    root.for(1,5).print();
    
}).run(function(result){
    
    console.log("process completed");
    console.log("\t result:" + result.helloWorld.result[0]);
    
})
```
> Result :
```shell
1
2
3
4
5
process completed
result: [1,2,3,4,5]
```

### 2.Advance

```javascript
var ftask=require("FTaskRunner");
var ftaskMysql=require("FTaskRunner-Mysql");

ftask.load(ftaskMysql).build("helloWorld"function(root){
    
    root
        .for(1,5)  // load a loop from 1 to 5 
        .custom(function(scope,next){ // create query based on loop
            next("SELECT * FROM TABLE where i>" + scope.$$input);
        })
        .mysqlQuery({ host:127.0.0.1,user:'sa',pass:'sa' }) // executes the query
        .foreach() // loop on every record
        .print(); // print record data into console
    
}).run(function(result){
    
    console.log("process completed");
    console.log("\t result:" + result.helloWorld.result[0]);
    
})
```

# Documents

## Overview

Ftask have 2sides, one building a process and another running the process.
at first you need to build your process by piping block to gather
next you need to run the branches and at the end you can have the result.  

## Building process

To create process you need to have a name and execution plan. ftask has a "build" method which accepts name and builderFunction.
* name : all process results returns by this name
* bulderFunction : a function which let you create your execution plan.
* block : every process created by piping blocks to gather. a block is a container of task and context of state.

> ftask allow you to create more than one execution plan, just by calling build method you can create more process.

> every process has a root block. root block is fluentable and all loaded task will load into block. 

in following example you can see we have used "for","string" and "print" task to create process.

```javascript

var ftask=require("FTaskRunner");
ftask.build("test",function(root){
    
    root
        .for(1,2)
        .string("hello").print();
    
});

``` 

## Load a tasks

Ftask cames with a simple required core tasks. but you can develope your own tasks or use npm or any other tools to load other tasks libraries.
by calling load method you can load other tasks into your project and then use them in fluent way.


in following example you can see we have loaded mysql tasks library and used those task to create a process.

``` javascript
var ftask=require("FTaskRunner");
var ftaskMySql=require("FTaskRunner-MySql");
ftask.load(ftaskMySql).build("test",function(root){
    
    // this sample execute a query twice and print the result in output
    
    root
        .for(1,2)
        .string("select 1 as id")
        .mysqlQuery({host:'',port:'',...})
        .print();
     
});
```

in this sample we have loaded MySql Tasks into build process and use them to build a process.

## Run a process

After you have created your process, its time to run it. for running a process you just 
need to call "run" method of ftask. ftask will handle the rest. the result will returns as a callback function.
ftask will rise callback function by passing err,result arguments. if process executed with error, the err argument will contains error detail otherwise results will contains all branchs of ftask result. 

```javascritp


```


##Github
Releases of FTaskRunner are available on [Github](https://github.com/javadparvaresh/FTaskRunner/releases).

##License
FTaskRunner is licensed under the MIT License. See the LICENSE file for details.

